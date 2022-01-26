import { Matrix, solve } from 'ml-matrix';
import {distance, numberInRange} from './utility.js'


export class Cluster {
    constructor(pts) {
        
        // this.testPtsOnCurve = this.testPtsOnCurve.bind(this);
        // this.getPointData = this.getPointData.bind(this);
        // this.fitCurveToPts = this.fitCurveToPts.bind(this);
        
        this.findSubClusters = this.findSubClusters.bind(this);
        this.ABCA = this.ABCA.bind(this);         //Angular-Based Clustering of Applications (custom)
        this.DBSCAN = this.DBSCAN.bind(this);       //Density-Based Spatial Clustering of Applications with Noise
        this.rangeQueryDBSCAN = this.rangeQueryDBSCAN.bind(this);
        this.rangeQueryABCA = this.rangeQueryABCA.bind(this);

        this.pts = pts;
        this.N = this.pts.length;
        this.xVals = this.pts.map(a=>a.x);
        this.yVals = this.pts.map(a=>a.y);
       
        // this.xRange = this.getXRange([0,this.pts.length]);
        // this.xMin = this.xRange[0];
        // this.xMax = this.xRange[1];

        this.subClusters = this.findSubClusters()
        
        
    }
    rangeQueryABCA = (cluster, ptIdx, ep) => {
        let neighbors = [];
        for(let p=0; p < cluster.length; ++p) {
            if(ptIdx==p) continue;
            if(numberInRange(cluster[ptIdx].gradientSlope,ep)) neighbors.push(p);
        }
        return neighbors;
    }
    rangeQueryDBSCAN = (ptIdx, ep) => {
        let neighbors = [];
        for(let p=0; p < this.pts.length; ++p) {
            if(ptIdx==p) continue;
            if(distance(this.pts[ptIdx],this.pts[p]) <= ep) neighbors.push(p);
        }
        return neighbors;
    }
    findSubClusters(additionalDims=null) {
        //additionalDims contains names of additional dimensions to be factored in
        var dbClusters = this.DBSCAN(); //density-based clusters

        //var abClusters = this.ABCA(dbClusters, .2); 
        //angular based clustering
        //then, norm-vector-based clusters (theta in pixel gradients)
        //for this to be possible, may need to remove 'corner' regions for this part

        return dbClusters;
    }
    ABCA(clusterData, tolerance=.01) {     //cluster data based on their normal vector (theta)
        var labeledPts = []     //holds indices of points that are already processed
        for(let c=0; c < clusterData.length; ++c)     labeledPts.push(Array(clusterData[c].length).fill(-1));
        
        var allSubClusters = []
        for(let c=0; c < clusterData.length; ++c) {
            var clusterIter = -1;
            for(let p=0; p < clusterData[c].length; ++p) {
                if(labeledPts[c][p]!=-1) continue; // point has already been processed
                var neighbors = this.rangeQueryABCA(clusterData[c], p, tolerance);
                if(neighbors.length < minPts) {
                    labeledPts[c][p] = 'noise';
                    continue;
                }
                ++clusterIter;
                labeledPts[c][p] = clusterIter;
                for(let neighP=0; neighP < neighbors.length; ++neighP) {
                    if(labeledPts[c][neighbors[neighP]]=='noise') labeledPts[c][neighbors[neighP]]=clusterIter;
                    if(labeledPts[c][neighbors[neighP]]!=-1) continue;
                    labeledPts[c][neighbors[neighP]]=clusterIter;
                    var otherNeighbors = this.rangeQueryABCA(clusterData[c], neighbors[neighP], tolerance);
                    if(otherNeighbors.length >= minPts) {
                        neighbors = [...new Set([...neighbors, ...otherNeighbors])]
                    }
                }
            }
            var subClusters=[];
            for(let c=0; c < clusterIter+1; ++c) subClusters.push([]);
            for(let p=0; p < labeledPts.length; ++p) {
                if(labeledPts[p] !="noise") subClusters[labeledPts[p]].push(this.pts[p]);
            }
            console.log('labeledPts', labeledPts)
            console.log('subClusters', subClusters)
            allSubClusters.push(subClusters)
        }
        return subClusters;        //a list of clusters (cluster = list of points)
    }
    DBSCAN(epsilon=null, minPts=4) {    //Density-Based Spatial Clustering of Applications with Noise
        //https://en.wikipedia.org/wiki/DBSCAN
        //also try clustering points based on their theta (from detectBlobs in imageManip); factor in the xGradient, yGradient, thetaGradient for each point

        // minPts --> must be at least 3 (if minPts<=2, result will be same as hierarchial clustering) 
        //           can be derived from # of dimensions of data set D.. minPts >=D+1 or minPts=D*2
        // epsilon --> calculated with https://towardsdatascience.com/machine-learning-clustering-dbscan-determine-the-optimal-value-for-epsilon-eps-python-example-3100091cfbc

        //calculate best epsilon by finding distances b/w all points, sorting those distances, then finding where the greatest change in distance occurs 
        if(epsilon==null) {
            var allDists = []
            for(let p=0; p < this.pts.length; ++p) {
                var thisDists = []
                for(let p2=0; p2 < this.pts.length; ++p2) {
                    if(p==p2) continue;
                    let d = distance(this.pts[p], this.pts[p2]);
                    thisDists.push(d);
                }
                thisDists.sort(function(a,b){return a-b});
                allDists.push(thisDists.slice(0,3));
            }
            allDists = allDists.flat()
            allDists.sort(function(a,b){return a-b});
            
            if(allDists.length==1) epsilon = allDists[0]
            else if(allDists.length==2) epsilon = allDists[1]-allDists[0]
            else {
                var distDeltas = [];
                for(let D=1; D < allDists.length; ++D) {
                    distDeltas.push([ allDists[D]-allDists[D-1], allDists[D], allDists[D-1] ])  //[deltaAB, A, B]
                }
                distDeltas.sort(function(a,b){return b[0]-a[0]});

                console.log("for error    ", this.pts.length, distDeltas, allDists)
                epsilon = (distDeltas[0][2] + distDeltas[0][1])/2;
            }
            
        }
       
        var clusterIter = -1;
        var labeledPts = Array(this.pts.length).fill(-1)     //holds indices of points that are already processed
        for(let p=0; p < this.pts.length; ++p) {
            if(labeledPts[p]!=-1) continue; // point has already been processed
            var neighbors = this.rangeQueryDBSCAN(p, epsilon);
            if(neighbors.length < minPts) {
                labeledPts[p] = 'noise';
                continue;
            }
            ++clusterIter;
            labeledPts[p] = clusterIter;
            for(let neighP=0; neighP < neighbors.length; ++neighP) {
                if(labeledPts[neighbors[neighP]]=='noise') labeledPts[neighbors[neighP]]=clusterIter;
                if(labeledPts[neighbors[neighP]]!=-1) continue;
                labeledPts[neighbors[neighP]]=clusterIter;
                var otherNeighbors = this.rangeQueryDBSCAN(neighbors[neighP], epsilon);
                if(otherNeighbors.length >= minPts) {
                    neighbors = [...new Set([...neighbors, ...otherNeighbors])]
                }
            }
        }
        var clusters=[];
        for(let c=0; c < clusterIter+1; ++c) clusters.push([]);
        
        for(let p=0; p < labeledPts.length; ++p) {
            if(labeledPts[p] !="noise") clusters[labeledPts[p]].push(this.pts[p]);
        }
        console.log('labeledPts', labeledPts)
        console.log('clusters', clusters)
        return clusters;        //a list of clusters (cluster = list of points)
    }
}