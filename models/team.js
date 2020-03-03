var mongoose = require("mongoose");

var teamSchema = mongoose.Schema({
	name : String,
	uid : String,
	level : [
		{
			num: {type: Number, default: 1},
			time: {type: Date}
		}
	],
	isAlive : {type: Boolean, default: true}
});

module.exports = mongoose.model("Team",teamSchema);