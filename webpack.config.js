const HTMLWebpackPlugin = require('html-webpack-plugin');

const HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
	template: __dirname + '/dist/index.html',
	filename: './index.html',
	inject: false
	

});

const path = require('path');



module.exports = {
	entry: './src/index.js',
	mode: 'development',
	
	module: {
		rules: [
		   {
		   	test: /\.(js|jsx)$/,
		   	exclude: /node_modules/,
		   	use: {loader: 'babel-loader'},
		   },
		   { 
		   	test: /\.css$/, 
		   	use: [
		   		{
		   		    loader: 'style-loader',
		   		    options: {
					esModule: false
				    }
		   		},
		   		
			   	{
			   	    loader: 'css-loader',
				}
				
			]
		   },
		   {
			test: /\.(png|jpe?g|gif)$/i,
			use: [
			  {
				loader: 'file-loader',
				options: {
					name: 'img/[name].[ext]'
				}
			  },
			],
			
		  },
		  {
			test: /\.svg$/,
			use: [
			  {
				loader: 'svg-url-loader',
				options: {
				  limit: 10000,
				},
			  },
			],
		  },
		]
		
	},
	output:{
		filename: 'transformed.js',
		path: path.resolve(__dirname, 'dist'),
		
		publicPath: '/',
		clean: true
		
		
		
	},
	devServer: {
		host: 'localhost',
		
		port: 8080,
		historyApiFallback: true,
		open: true,
		hot: true,
		//contentBase: path.basename.join(__dirname,'public')
		

	},
	
	plugins: [
		HTMLWebpackPluginConfig,
		
	],
	resolve: {
		
        	extensions: [".js", ".jsx"]
    	},
	
	
};
