// import { Matrix, solve } from 'ml-matrix';
import {distance, numberInRange} from './utility.js'


export class Cluster {
    constructor(pts, clusteringOrder=[{name:'density', epsilonMultiplier:1, minPts:3}, {name:'magGradient', epsilonMultiplier:1, minPts:2}]) {
        
        this.findSubClusters = this.findSubClusters.bind(this);
        this.DBSCAN = this.DBSCAN.bind(this);       //Density-Based Spatial Clustering of Applications with Noise
        this.ABCAN1D =  this.ABCAN1D.bind(this);         //1D Attribute-Based Clustering of Applications with Noise  (custom)
        this.rangeQueryDBSCAN = this.rangeQueryDBSCAN.bind(this);
        this.rangeQueryABCAN1D = this.rangeQueryABCAN1D.bind(this);

        this.pts = pts;
        this.N = this.pts.length;
        this.xVals = this.pts.map(a=>a.x);
        this.yVals = this.pts.map(a=>a.y);
        this.clusteringOrder = clusteringOrder;
        this.subClusters = this.findSubClusters(clusteringOrder)
    }
    ABCAN1D(clusterData, epsilonMultiplier, minPts, attribute ) {     //Attribute-Based Clustering of Applications with Noise, 1 Dimensional (i.e magntiude, theta)
        
        // Calculate the best epsilon by finding differences b/w all points' attributes, sorting them, then finding where the greatest change occurs 

        var allDiffs = []
        for(let p=0; p < clusterData.length; ++p) {
            var thisDiffs = []
            for(let p2=0; p2 < clusterData.length; ++p2) {
                let cluster1 = clusterData[p];
                let cluster2 = clusterData[p2];
                if(p==p2) continue;
                let d = cluster1[attribute] > cluster2[attribute]? cluster1[attribute]-cluster2[attribute] : cluster2[attribute]-cluster1[attribute]; 

                thisDiffs.push(d);
            }
            thisDiffs.sort(function(a,b){return a-b});
            allDiffs.push(thisDiffs.slice(0,3));
        }
        allDiffs = allDiffs.flat()
        allDiffs.sort(function(a,b){return a-b});
        var diffDeltas = [];
        for(let D=1; D < allDiffs.length; ++D) diffDeltas.push([ allDiffs[D]-allDiffs[D-1], allDiffs[D], allDiffs[D-1] ])  //[deltaAB, A, B]
        
        diffDeltas.sort(function(a,b){return b[0]-a[0]});
        
        var epsilon = (diffDeltas[0][2] + diffDeltas[0][1])/2; 
        
        epsilon*=epsilonMultiplier;

        
        console.log(attribute+ ' epsilon: ',epsilon)
        var clusterIter = -1;
        var labeledPts = Array(clusterData.length).fill(-1)     //holds indices of points that are already processed
        for(let p=0; p < clusterData.length; ++p) {
            if(labeledPts[p]!=-1) continue; // point has already been processed
            var neighbors = this.rangeQueryABCAN1D(clusterData,p, epsilon, attribute);
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
                var otherNeighbors = this.rangeQueryABCAN1D(clusterData, neighbors[neighP], epsilon, attribute);
                if(otherNeighbors.length >= minPts) {
                    neighbors = [...new Set([...neighbors, ...otherNeighbors])]
                }
            }
        }
        var clusters=[];
        for(let c=0; c < clusterIter+1; ++c) clusters.push([]);
        
        for(let p=0; p < labeledPts.length; ++p) {
            if(labeledPts[p] !="noise") clusters[labeledPts[p]].push(clusterData[p]);
        }
        console.log('labeledPts', labeledPts)
        console.log('clusters', clusters)
        return clusters;        //a list of clusters (cluster = list of points)
    }
       
    rangeQueryABCAN1D = (cluster, ptIdx, ep, attr) => {  //returns a list of INDEXs of neighbors to ptIdx
        let neighbors = [];
        for(let p=0; p < cluster.length; ++p) {
            if(ptIdx==p) continue;
            if(numberInRange(cluster[ptIdx][attr],cluster[p][attr],ep)) neighbors.push(p);     //number, target, degreeOfTolerance
        }
        return neighbors;
    }
   
    rangeQueryDBSCAN = (clusterData, ptIdx, ep) => {     //returns a list of INDEXs of neighbors to ptIdx
        let neighbors = [];
        for(let p=0; p < clusterData.length; ++p) {
            if(ptIdx==p) continue;
            if(distance(clusterData[ptIdx], clusterData[p]) <= ep) neighbors.push(p);
        }
        return neighbors;
    }
    findSubClusters(clusteringOrder) {
        //clusteringOrder --> clustering operations will execute in the order specified from this variable. Default: only density based clustering

        var allClusters = [this.pts];
        for(let op=0; op < clusteringOrder.length; ++op) {
            var temp = []
            if(clusteringOrder[op].name=='density') {               //Density-Based Clustering
                for(let c=0; c < allClusters.length; ++c) {
                    if(allClusters[c].length==0) continue;
                    temp = temp.concat( this.DBSCAN(allClusters[c],clusteringOrder[op].epsilonMultiplier, clusteringOrder[op].minPts) );   
                }
            }
            else if(clusteringOrder[op].name=='magGradient') {       //1 Dimensional Attribute-Based Clustering
                for(let c=0; c < allClusters.length; ++c) {
                    if(allClusters[c].length==0) continue;
                    temp = temp.concat(this.ABCAN1D(allClusters[c], clusteringOrder[op].epsilonMultiplier, clusteringOrder[op].minPts, 'magGradient'))   
                }
            }
            else if(clusteringOrder[op].name=='thetaGradient') {    //1 Dimensional Attribute-Based Clustering
                for(let c=0; c < allClusters.length; ++c) {
                    if(allClusters[c].length==0) continue;
                    temp = temp.concat(this.ABCAN1D(allClusters[c], clusteringOrder[op].epsilonMultiplier, clusteringOrder[op].minPts, 'thetaGradient'))    
                }
            }
            else if(clusteringOrder[op].name=='slope') {             //1 Dimensional Attribute-Based Clustering
                for(let c=0; c < allClusters.length; ++c) {
                    if(allClusters[c].length==0) continue;
                    temp = temp.concat(this.ABCAN1D(allClusters[c], clusteringOrder[op].epsilonMultiplier, clusteringOrder[op].minPts, 'slope'))    
                } 
            }
            else return -1;
            allClusters = [...temp];
        }
        console.log('allClusters',allClusters)
        return allClusters;
    }
    
    DBSCAN(clusterData,epsilonMultiplier=1, minPts=4) {    //Density-Based Spatial Clustering of Applications with Noise
        //https://en.wikipedia.org/wiki/DBSCAN
        //also try clustering points based on their theta (from detectBlobs in imageManip); factor in the xGradient, yGradient, thetaGradient for each point

        // minPts --> must be at least 3 (if minPts<=2, result will be same as hierarchial clustering) 
        //           can be derived from # of dimensions of data set D.. minPts >=D+1 or minPts=D*2
        // epsilon --> calculated with https://towardsdatascience.com/machine-learning-clustering-dbscan-determine-the-optimal-value-for-epsilon-eps-python-example-3100091cfbc

        //calculate best epsilon by finding distances b/w all points, sorting those distances, then finding where the greatest change in distance occurs 
       
        var allDists = []
        for(let p=0; p < clusterData.length; ++p) {
            var thisDists = []
            for(let p2=0; p2 < clusterData.length; ++p2) {
                if(p==p2) continue;
                let d = distance(clusterData[p], clusterData[p2]);
                thisDists.push(d);
            }
            thisDists.sort(function(a,b){return a-b});
            allDists.push(thisDists.slice(0,minPts));
        }
        allDists = allDists.flat()
        allDists.sort(function(a,b){return a-b});
        
        var distDeltas = [];
        for(let D=1; D < allDists.length; ++D) {
            distDeltas.push([ allDists[D]-allDists[D-1], allDists[D], allDists[D-1] ])  //[deltaAB, A, B]
        }
        distDeltas.sort(function(a,b){return b[0]-a[0]});
        var epsilon = (distDeltas[0][2] + distDeltas[0][1])/2;

        epsilon *=epsilonMultiplier;        
        console.log('epsilon',epsilon)
        var clusterIter = -1;
        var labeledPts = Array(clusterData.length).fill(-1)     //holds indices of points that are already processed
        for(let p=0; p < clusterData.length; ++p) {
            if(labeledPts[p]!=-1) continue; // point has already been processed
            var neighbors = this.rangeQueryDBSCAN(clusterData,p, epsilon);
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
                var otherNeighbors = this.rangeQueryDBSCAN(clusterData, neighbors[neighP], epsilon);
                if(otherNeighbors.length >= minPts) {
                    neighbors = [...new Set([...neighbors, ...otherNeighbors])]
                }
            }
        }
        var clusters=[];
        for(let c=0; c < clusterIter+1; ++c) clusters.push([]);
        
        for(let p=0; p < labeledPts.length; ++p) {
            if(labeledPts[p] !="noise") clusters[labeledPts[p]].push(clusterData[p]);
        }
        console.log('labeledPts', labeledPts)
        console.log('clusters', clusters)
        return clusters;        //a list of clusters (cluster = list of points)
    }
}