const express = require('express');

const app = express();

app.post('/', function requestHandler(req, res) {
  console.log("name", req.query.name);
  res.json({
    message:"wellcome"
  })
});


app.get('/playerJoin',function playerStats(req,res){
  
  const name = req.query.name;
  console.log("player "+name+'join')
  res.json({
    playerName:"playerName"+name,
    money:10
  })
})

const server = app.listen(3000,()=>{
  console.log("server start")
});

