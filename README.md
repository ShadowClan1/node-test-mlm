# node-test-mlm

# To distribute
POST http://localhost:3000/api/distribute  
{
 "userId" : 19,
  "amount" : 100
}

# To add user

POST http://localhost:3000/api/users   

{
  "name" : "level10",
  "parentId" : 20
}

# To get user with userId

GET http://localhost:3000/api/get-user-details/:userId
# To get all userdetails
GET http://localhost:3000/api//get-all-user-details

This task involves a task queue and cache as well you can it out
