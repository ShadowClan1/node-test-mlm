const {  User } = require("../db/db");
const { RES, STATUS } = require("../utils/ResponseHandlers");
require('dotenv').config()
//for task queue
const taskQueue = []


//for cache of the levels ( we can use redis on production server)
const cache = {

}


const express = require("express"),
  router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    let data = "test route";
    RES(res, STATUS.OK, "Test route", data);
  } catch (err) {
    RES(res, STATUS.INTERNAL_SERVER_ERROR, err.message);
  }
});

router.get("/get-user-details", async (req,res)=>{
  try {
    const users = await User.findAll();
    RES(res, STATUS.OK, "Users fetched successfully", users);
  } catch (error) {
    RES(res, STATUS.INTERNAL_SERVER_ERROR, err.message);
  }

})



router.post("/users", async (req, res, next) => {
  try {
    const {name, parentId} = req.body
    const user = await User.create({name , parent_id : parentId });
    await changeLevels(user.id)
    RES(res, STATUS.OK, "User created successfully", user);
  } catch (err) {
    RES(res, STATUS.INTERNAL_SERVER_ERROR, err.message);
  }
});

router.post("/distribute", async (req, res) => {
  try {
   let {userId,  amount} = req.body;
   let levelOfUser = calculateLevel(userId);
   // we have two scenarios here level 8 will provide 40 to parent so that all are covered level 2 will provide 20% let divide the whole to parent let say from
  taskQueue.push({userId , amount})
  if(taskQueue.length == 1) {
    startTaskQueue()
  }

  


    RES(res, STATUS.OK, "Amount will be distributed successfully", { });
  } catch (err) {
    RES(res, STATUS.INTERNAL_SERVER_ERROR, err.message);
  }
});


function startTaskQueue() {
  while(taskQueue.length != 0) {

    let processObject = taskQueue.shift();
    try {
      const {userId, amount} = processObject;
      let levelOfCurrentUser
    
  } catch (error) {
    if(processObject.failure < 3)taskQueue.push({...processObject, failure : (processObject.failure ?? 0) + 1 })
    }
}
}



async function calculateLevel(userId){
  if(cache[userId]) return cache[userId];
  const user = await User.findOne({where : {id :userId}});
  
  if(user.parent_id === null) {return 0}
  else {
    let result =  calculateLevel(userId) +1 ;
    cache[userId] = result;
    return result;
   } 
}

async function changeLevels(userId){
  const user = await User.findOne({where : {id :userId}});
  
  if(user.parent_id === null) {
    cache[userId] = 0
    return 0
  }
  else {
    let result =  calculateLevel(user.parent_id) +1 ;
    cache[userId] = result;
    return result;
   } 
}



module.exports = router;
