const { User } = require("../db/db");
const { RES, STATUS } = require("../utils/ResponseHandlers");
const { distributionPattern } = require("../utils/constants");
require("dotenv").config();
//for task queue
const taskQueue = [];

//for cache of the levels ( we can use redis on production server)
const cache = {};

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

router.get("/get-all-user-details", async (req, res) => {
  try {
    const users = await User.findAll();
    RES(res, STATUS.OK, "Users fetched successfully", users);
  } catch (error) {
    RES(res, STATUS.INTERNAL_SERVER_ERROR, err.message);
  }
});
router.get("/get-user-details/:id", async (req, res) => {
  try {
    let { id } = req.params;
    if (!id) {
      return RES(res, STATUS.BAD_REQUEST, "Enter id of the user");
    }
    const user = await User.findOne({ where: { id } });
    if (!user) {
      return RES(res, STATUS.NOT_FOUND, "User not found");
    }
    let levelOfCurrentUser = await calculateLevel(user.id);
    console.log(cache);
    RES(res, STATUS.OK, "Users fetched successfully", {
      ...user.dataValues,
      levelOfCurrentUser,
    });
  } catch (error) {
    RES(res, STATUS.INTERNAL_SERVER_ERROR, err.message);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const { name, parentId } = req.body;
    if (parentId) {
      const existing = await User.findOne({ where: { parent_id: parentId } });
      if (existing) {
        return RES(
          res,
          STATUS.BAD_REQUEST,
          "Person under this parent id already exists"
        );
      }
      const existingParent = await User.findOne({ where: { id: parentId } });
      if (!existingParent) {
        return RES(res, STATUS.BAD_REQUEST, "No parent exists with this id");
      }
      const levelOfParent = await calculateLevel(parentId);
      if (levelOfParent >= 8)
        return RES(
          res,
          STATUS.BAD_REQUEST,
          "Chain must have highest length of 9"
        );
    }
    const user = await User.create({ name, parent_id: parentId });
    let levelOfCurrentUser = await calculateLevel(user.id);

    RES(res, STATUS.OK, "User created successfully", {
      ...user.dataValues,
      levelOfCurrentUser,
    });
  } catch (err) {
    console.log(err);
    RES(res, STATUS.INTERNAL_SERVER_ERROR, err.message);
  }
});

router.post("/distribute", async (req, res) => {
  try {
    let { userId, amount } = req.body;
    if (amount <= 0 || Number.isNaN(amount)) {
      return RES(res, STATUS.OK, "Amount could not be distributed");
    }
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return RES(
        res,
        STATUS.BAD_REQUEST,
        "User not found to distribute the amount"
      );
    }
    taskQueue.push({ userId, amount });
    console.log(taskQueue.length, "task queue length");
    if (taskQueue.length == 1) {
       startTaskQueue();
    }

    RES(res, STATUS.OK, "Amount will be distributed successfully", {});
  } catch (err) {
    RES(res, STATUS.INTERNAL_SERVER_ERROR, err.message);
  }
});

async function startTaskQueue() {
  while (taskQueue.length != 0) {
    let processObject = taskQueue.shift();
    try {
      const { userId, amount } = processObject;
      let levelOfCurrentUser = await calculateLevel(userId);
      let parentIdMap = await findParentLevels(userId);
      console.log(parentIdMap, "parentIdMap");
      for (let i = levelOfCurrentUser; i >= 0; i--) {
        console.log(
          `level of current user ${i} will get ${
            amount * (distributionPattern[levelOfCurrentUser][i] / 100)
          }`
        );
        try {
          const user = await User.findOne({ where: { id: parentIdMap[i] } });

          user.amount +=
            amount * (distributionPattern[levelOfCurrentUser][i] / 100);

          await user.save();
        } catch (err) {

        }
      }
    } catch (error) {
      if (processObject.failure < 3)
        taskQueue.push({
          ...processObject,
          failure: (processObject.failure ?? 0) + 1,
        });
    }
  }
}

async function calculateLevel(userId) {
  console.log(userId, "this is the userId");
  if (cache[userId]) return cache[userId];
  if (userId == null) {
    return 0;
  }
  const user = await User.findOne({ where: { id: userId } });
  if (!user || !user.parent_id) {
    cache[userId] = 0;
    return 0;
  }

  let result = (await calculateLevel(user.parent_id)) + 1;
  cache[userId] = result;
  return result;
}

async function findParentLevels(userId) {
  let result = [];
  console.log(userId, "this is userId");
  let user = await User.findOne({ where: { id: userId } });
  while (user && user.parent_id) {
    result.unshift(user.id);
    user = await User.findOne({ where: { id: user.parent_id } });
  }
  return result;
}

async function changeLevels(userId) {
  const user = await User.findOne({ where: { id: userId } });

  if (user.parent_id === null) {
    cache[userId] = 0;
    return 0;
  } else {
    let result = calculateLevel(user.parent_id) + 1;
    cache[userId] = result;
    return result;
  }
}

module.exports = router;
