var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
const voucher_codes = require('voucher-code-generator');
const logger = require('morgan');
const fs = require("fs");
var User = require("./models/user");
var Team = require("./models/team");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var middleware = require("./middleware");
const seed = require("./seeds/seedAdmin");

var app = express();

app.set("view engine","ejs");

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({extended : true}));

app.use(logger("common", {
	stream: fs.createWriteStream('./masqueradeLogs.log', {flags: 'a'})
}));

app.use(logger('dev'));

mongoose.connect("mongodb://localhost:27017/masquerade",{useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useFindAndModify",false);

// passport config
app.use(require("express-session")({
	secret : "your secret key here",
	resave : false,
	saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

seed();

app.use((req,res,next) => {
	res.locals.userData = req.user;
	next();
});

app.get("/",(req,res) => {
	res.redirect("/team");
});

app.get("/team",middleware.isLoggedin,(req,res) => {
	Team.find({},(err,foundTeams) => {
		if(err) {
			console.log(err);
			res.send("failed");
		}
		else {
			res.render("team/show",{data : foundTeams});
		}
	});
});

app.get("/team/new",middleware.isLoggedin,(req,res) => {
	res.render("team/new");
});

// var userIdCount = 0;
// const userIds = [10509, 11681, 15747, 20101, 21060, 21918, 22143, 23269, 25461, 26007, 26098, 31531, 34725, 35292, 37287, 38516, 42165, 43206, 43603, 47289, 49553, 49694, 51502, 53699, 54177, 56834, 57648, 59993, 64584, 64861];
app.post("/team",middleware.isLoggedin,(req,res) => {
	var code =  voucher_codes.generate({
		length: 4,
		prefix: "MAS-",
		charset: voucher_codes.charset("numbers")
	  });

	var teamData = {
		name : req.body.name,
		uid : code[0],
		level : [
			{
				num : 1,
				time : null
		}
		],
		isAlive : true
	};

	// userIdCount++;
	Team.create(teamData,(err,foundTeam) => {
		if(err) {
			console.log(err);
			res.send("failed");
		}
		else {
			console.log(foundTeam);
			res.redirect("/team");
		}
	});
});

app.get("/team/:id/show",middleware.isLoggedin,(req,res) => {
	Team.findOne({_id : req.params.id}).then((team) => {
		res.render("team/showteam",{team});
	});
});

// app : init
app.get("/app/team/:uid",(req,res) => {
	Team.findOne({uid : req.params.uid},(err,foundTeam) => {
		if(err) {
			console.log(err);
			res.send("failed");
		}
		else {
			console.log(foundTeam[0]);
			var teamData = {
				uid : foundTeam.uid,
				name : foundTeam.name,
				level : foundTeam.level[foundTeam.level.length - 1].num,
				isAlive : foundTeam.isAlive
			};
			res.json(teamData);
		}
	});
});

// level up info : app
app.post("/app/team/:uid/update",(req,res) => {
	
	Team.findOne({uid : req.params.uid}).then((team)=>{
		if(team.isAlive) {
			var d = new Date(Date.now());
			d.setHours(d.getHours() + 5);
			d.setMinutes(d.getMinutes() + 30);
			team.level[team.level.length - 1].time = d;
			var level = {
				num: req.body.level,
				time: null
			};
			team.level.push(level);
			team.save().then(() => {
				res.json({success: true, message: `Team ${req.params.uid} passed level ${req.body.level}`});
			});
		} 
		else {
			res.json({success: false, message: `Team ${req.params.uid} is kicked`});
		}
		
	})
	
});

// kick
app.get("/team/:id/kick",middleware.isLoggedin,(req,res) => {
	Team.findByIdAndUpdate(req.params.id,{isAlive : false},(err,foundTeam) => {
		if(err) {
			console.log(err);
			res.send("failed");
		}
		else {
			console.log(foundTeam);
			res.redirect("/team")
		}
	});
});

// send player data
app.get("/getAllPlayers", middleware.isLoggedin, (req, res)=>{
	Team.find({}).then((teams)=>{
		res.json({success: true, teams: teams});
	})
})

// override
app.get("/team/:id/:level/override",middleware.isLoggedin,(req,res) => {
	Team.findOne({_id: req.params.id}).then(team=>{
		if(team.isAlive){
			var d = new Date(Date.now());
			d.setHours(d.getHours() + 5);
			d.setMinutes(d.getMinutes() + 30);
			team.level[team.level.length - 1].time = d;
			var level = {
				num: Number(req.params.level)+1,
				time: null
			}
			team.level.push(level);
			team.save().then(()=>{
				res.redirect('/team');
			});
		}else{
			res.send(`Team ${team.name} is kicked`);
		}
	}).catch((err)=>{
		console.log(err);
		res.send(err);
	})
});


// login (get)
app.get("/login",(req,res) => {
	res.render("login");
});

// login (post)
app.post("/login",passport.authenticate("local", {
	failureRedirect : "/login"
}),(req,res) => {
	console.log("done");
	if(req.isAuthenticated()) {
		res.redirect("/team");
	}
});

// logout
app.get("/logout",(req,res) => {
	req.logout();
	res.redirect("/login");
});

app.listen(3000,() => {
	console.log("server started");
});