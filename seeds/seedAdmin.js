const User = require("../models/user");

const seed = ()=>{
        User.deleteMany({username: "hydra"}).then(()=>{
            User.register({username: "hydra"}, "$hydra$").then((newAdmin)=>{
                console.log("Admin created");
            });
        });
}

module.exports = seed;
