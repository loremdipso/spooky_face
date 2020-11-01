const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');


module.exports = {
	entry: "./src/index.ts",

	target: "web",
	mode: "development",

	output: {
		path: path.resolve(__dirname, "docs"),
		filename: 'bundle.js',

		// it's weird why this is necessary, but w/e
		publicPath: "./"
	},

	devServer: {
		compress: true,
		publicPath: "/",
		contentBase: path.join(__dirname, 'src', 'public'),

		stats: {
			warnings: false
		},
		port: 9000
	},

	plugins: [new HtmlWebpackPlugin({
		template: "src/public/index.html",

		// use hash here instead of in the actual generated filename
		// for version control sanity, mostly
		hash: true
	})],

	resolve: {
		extensions: [".json", ".ts", ".js", ".css", ".scss"],
		plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],
	},

	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				loader: "ts-loader",
			},
			{
				test: /\.(png|svg|ico|jpe?g|gif)$/i,
				use: [
					'file-loader',
				],
			},
		],
	},
};
