const gold = 0.1;
const silver = 0.1;
const bronze = 0.2;
const wood = 0.6;
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");

async function updateRankings(client, guild_id, channel_id) {
    var guild = client.guilds.cache.get(guild_id);
    var changeArray = [];
    const inactiveUsers = await mongoUsers.find({ wins: 0, losses: 0 ,deleted: {$ne: true}}).toArray()
    const activeUsers = await mongoUsers.find({ $or: [ { wins: { $gt: 0 } }, { losses: { $gt: 0 } } ] , deleted: {$ne: true}}).toArray()
    for(let i = 0; i < inactiveUsers.length; i++){
        let user = inactiveUsers[i]
        if(user.rank != "st"){
            let oldRank;
            switch(user.rank) {
                case "st":
                  oldRank = "Stone"
                  break;
                case "g":
                    oldRank = "Gold"
                  break;
                  case "si":
                    oldRank = "Silver"
                  break;
                  case "b":
                    oldRank = "Bronze"
                  break;
                  case "w":
                    oldRank = "Wood"
                  break;
                default:
                  oldRank = null;
              }
              if(oldRank){
                changeArray.push(user.firstName + " " + user.lastName + " was demoted ``" + oldRank + " ➜ Stone``")

              }else{
                
                changeArray.push(user.firstName + " " + user.lastName + "'s rank was changed to stone") 

              }
            await mongoUsers.updateOne({id: user.id}, {$set:{rank: "st"}});
        }
        try{
        const member = await guild.members.fetch(user.id);
        if(member.roles.cache.some(role => role.name === 'Gold')){
            var goldRole = member.guild.roles.cache.find(role => role.name == "Gold");
            member.roles.remove(goldRole);
        }
        if(member.roles.cache.some(role => role.name === 'Silver')){
            var silverRole = member.guild.roles.cache.find(role => role.name == "Silver");
            member.roles.remove(silverRole);
        }
        if(member.roles.cache.some(role => role.name === 'Bronze')){
            var bronzeRole = member.guild.roles.cache.find(role => role.name == "Bronze");
            member.roles.remove(bronzeRole);
        }
        if(member.roles.cache.some(role => role.name === 'Wood')){
            var woodRole = member.guild.roles.cache.find(role => role.name == "Wood");
            member.roles.remove(woodRole);
        }
        if(!member.roles.cache.some(role => role.name === 'Stone')){
            var role = member.guild.roles.cache.find(role => role.name == "Stone");
            member.roles.add(role);
        }
    }catch{console.log("Couldn't find the user " + user.id+ " to assign them a rank")}
    }
    var eloArray = [];
    var idArray = [];
    var rankArray = [];
    var diamondArray = []
    for(let i = 0; i < activeUsers.length; i++){
        let user = activeUsers[i]
        eloArray.push(user.elo)
        idArray.push(user.id)
        rankArray.push(user.rank)
        diamondArray.push(user.diamond)
    }

    sortedArrays = quickSortFourArraysDescending(eloArray, idArray, rankArray, diamondArray)
    eloArray = sortedArrays[0]
    idArray = sortedArrays[1]
    rankArray = sortedArrays[2]
    diamondArray = sortedArrays[3];
    let totalNumber = activeUsers.length;
    var goldNumber = Math.round(gold*totalNumber)
    var silverNumber = Math.round(silver*totalNumber);
    var bronzeNumber = Math.round(bronze*totalNumber);
    var goldB = 0;
    var goldU = goldNumber-1;
    var silverB = goldNumber;
    var silverU = silverNumber+goldNumber - 1;
    var bronzeB = silverNumber;
    var bronzeU = bronzeNumber +silverNumber+goldNumber- 1;
    var woodB = bronzeNumber;
    var woodU = activeUsers.length;
    
    while(eloArray[goldU] == eloArray[silverB]){
        if(silverB+1 == silverU){
            break;
        }
        silverB++;
        goldU++;
    }
    while(eloArray[silverU] == eloArray[bronzeB]){
        if(bronzeB+1 == bronzeU){
            break;
        }
        bronzeB++;
        silverU++;
    }
    while(eloArray[bronzeU] == eloArray[woodB]){
        if(woodB+1 == woodU){
            break;
        }
        woodB++;
        bronzeU++;
    }
    for(let i = 0; i < eloArray.length; i++){
        if(i<=2){
            if(!diamondArray[i]){
                await mongoUsers.updateOne({id: idArray[i]}, {$set:{diamond: true}});
                let results = await mongoUsers.findOne({id: idArray[i]});
                changeArray.push(results.firstName + " " + results.lastName + " has entered the top 3, and is now diamond")
            }
            try{
                const member = await guild.members.fetch(idArray[i]);
                if(!member.roles.cache.some(role => role.name === 'Diamond')){
                    var diamondRole = member.guild.roles.cache.find(role => role.name == "Diamond");
                    await member.roles.add(diamondRole);
                }                
            }catch{console.log("Couldn't find the user " + idArray[i]+ " to assign them a rank")}        }else{
            if(diamondArray[i]){
                await mongoUsers.updateOne({id: idArray[i]}, {$set:{diamond: false}});
                let results = await mongoUsers.findOne({id: idArray[i]});
                changeArray.push(results.firstName + " " + results.lastName + " is no longer in the top 3, and has lost diamond")
            }
            try{
                const member = await guild.members.fetch(idArray[i]);
                if(member.roles.cache.some(role => role.name === 'Diamond')){
                var diamondRole = member.guild.roles.cache.find(role => role.name == "Diamond");
                await member.roles.remove(diamondRole);
            }
            }catch{console.log("Couldn't find the user " + idArray[i]+ " to assign them a rank")}
        }
        if(i >= goldB && i <= goldU){
            if(rankArray[i] != "g"){
                let results = await mongoUsers.findOne({id: idArray[i]});
                changeArray.push(rankChange(results.firstName, results.lastName, rankArray[i], "g"))
                await mongoUsers.updateOne({id: idArray[i]}, {$set:{rank: "g"}});
            }
            try{
                const member = await guild.members.fetch(idArray[i]);
                if(member.roles.cache.some(role => role.name === 'Stone')){
                    var stoneRole = member.guild.roles.cache.find(role => role.name == "Stone");
                    member.roles.remove(stoneRole);
                }
                if(member.roles.cache.some(role => role.name === 'Silver')){
                    var silverRole = member.guild.roles.cache.find(role => role.name == "Silver");
                    member.roles.remove(silverRole);
                }
                if(member.roles.cache.some(role => role.name === 'Bronze')){
                    var bronzeRole = member.guild.roles.cache.find(role => role.name == "Bronze");
                    member.roles.remove(bronzeRole);
                }
                if(member.roles.cache.some(role => role.name === 'Wood')){
                    var woodRole = member.guild.roles.cache.find(role => role.name == "Wood");
                    member.roles.remove(woodRole);
                }
                if(!member.roles.cache.some(role => role.name === 'Gold')){
                    var role = member.guild.roles.cache.find(role => role.name == "Gold");
                    member.roles.add(role);
                }
                
            }catch{console.log("Couldn't find the user " + idArray[i]+ " to assign them a rank")}        }else if(i >= silverB && i <= silverU){
            if(rankArray[i] != "si"){
                let results = await mongoUsers.findOne({id: idArray[i]});
                changeArray.push(rankChange(results.firstName, results.lastName, rankArray[i], "si"))
                await mongoUsers.updateOne({id: idArray[i]}, {$set:{rank: "si"}});
            }
            try{
                const member = await guild.members.fetch(idArray[i]);
                if(member.roles.cache.some(role => role.name === 'Stone')){
                    var stoneRole = member.guild.roles.cache.find(role => role.name == "Stone");
                    member.roles.remove(stoneRole);
                }
                if(member.roles.cache.some(role => role.name === 'Gold')){
                    var goldRole = member.guild.roles.cache.find(role => role.name == "Gold");
                    member.roles.remove(goldRole);
                }
                if(member.roles.cache.some(role => role.name === 'Bronze')){
                    var bronzeRole = member.guild.roles.cache.find(role => role.name == "Bronze");
                    member.roles.remove(bronzeRole);
                }
                if(member.roles.cache.some(role => role.name === 'Wood')){
                    var woodRole = member.guild.roles.cache.find(role => role.name == "Wood");
                    member.roles.remove(woodRole);
                }
                if(!member.roles.cache.some(role => role.name === 'Silver')){
                    var role = member.guild.roles.cache.find(role => role.name == "Silver");
                    member.roles.add(role);
                }

            }catch{console.log("Couldn't find the user " + idArray[i]+ " to assign them a rank")}        }else if(i >= bronzeB && i <= bronzeU){
            if(rankArray[i] != "b"){
                let results = await mongoUsers.findOne({id: idArray[i]});
                changeArray.push(rankChange(results.firstName, results.lastName, rankArray[i], "b"))
                await mongoUsers.updateOne({id: idArray[i]}, {$set:{rank: "b"}});   
            }
            try{
                
                const member = await guild.members.fetch(idArray[i]);
                if(member.roles.cache.some(role => role.name === 'Stone')){
                    var stoneRole = member.guild.roles.cache.find(role => role.name == "Stone");
                    member.roles.remove(stoneRole);
                }
                if(member.roles.cache.some(role => role.name === 'Gold')){
                    var goldRole = member.guild.roles.cache.find(role => role.name == "Gold");
                    member.roles.remove(goldRole);
                }
                if(member.roles.cache.some(role => role.name === 'Silver')){
                    var silverRole = member.guild.roles.cache.find(role => role.name == "Silver");
                    member.roles.remove(silverRole);
                }
                if(member.roles.cache.some(role => role.name === 'Wood')){
                    var woodRole = member.guild.roles.cache.find(role => role.name == "Wood");
                    member.roles.remove(woodRole);
                }
                if(!member.roles.cache.some(role => role.name === 'Bronze')){
                    var role = member.guild.roles.cache.find(role => role.name == "Bronze");
                    member.roles.add(role);
                }

            }catch{console.log("Couldn't find the user " + idArray[i]+ " to assign them a rank")}        }else if(i >= woodB && i <= woodU){
            if(rankArray[i] != "w"){
                let results = await mongoUsers.findOne({id: idArray[i]});
                changeArray.push(rankChange(results.firstName, results.lastName, rankArray[i], "w"))
                await mongoUsers.updateOne({id: idArray[i]}, {$set:{rank: "w"}});
            }
            try{
                const member = await guild.members.fetch(idArray[i]);
                if(member.roles.cache.some(role => role.name === 'Stone')){
                    var stoneRole = member.guild.roles.cache.find(role => role.name == "Stone");
                    member.roles.remove(stoneRole);
                }
                if(member.roles.cache.some(role => role.name === 'Gold')){
                    var goldRole = member.guild.roles.cache.find(role => role.name == "Gold");
                    member.roles.remove(goldRole);
                }
                if(member.roles.cache.some(role => role.name === 'Silver')){
                    var silverRole = member.guild.roles.cache.find(role => role.name == "Silver");
                    member.roles.remove(silverRole);
                }
                if(member.roles.cache.some(role => role.name === 'Bronze')){
                    var bronzeRole = member.guild.roles.cache.find(role => role.name == "Bronze");
                     member.roles.remove(bronzeRole);
                }
                if(!member.roles.cache.some(role => role.name === 'Wood')){
                    var role = member.guild.roles.cache.find(role => role.name == "Wood");
                     member.roles.add(role);
                }

            }catch{console.log("Couldn't find the user " + idArray[i]+ " to assign them a rank")}        }
    }    
    const channel = client.channels.cache.get(channel_id);
    for(let i = 0; i<changeArray.length; i++){
        channel.send(changeArray[i]);    
    }
}
function quickSortFourArraysDescending(arr1, arr2, arr3, arr4) {
    if (arr1.length <= 1) {
      return [arr1, arr2, arr3, arr4];
    }
    let pivotIndex = arr1.length - 1;
    let pivot = arr1[pivotIndex];
    let left1 = [];
    let left2 = [];
    let left3 = [];
    let left4 = [];
    let right1 = [];
    let right2 = [];
    let right3 = [];
    let right4 = [];
    for (let i = 0; i < pivotIndex; i++) {
      if (arr1[i] > pivot) {
        left1.push(arr1[i]);
        left2.push(arr2[i]);
        left3.push(arr3[i]);
        left4.push(arr4[i]);
      } else {
        right1.push(arr1[i]);
        right2.push(arr2[i]);
        right3.push(arr3[i]);
        right4.push(arr4[i]);
      }
    }
    let sortedLeftArrays = quickSortFourArraysDescending(
      left1,
      left2,
      left3,
      left4
    );
    let sortedRightArrays = quickSortFourArraysDescending(
      right1,
      right2,
      right3,
      right4
    );
    return [
      [...sortedLeftArrays[0], pivot, ...sortedRightArrays[0]],
      [...sortedLeftArrays[1], arr2[pivotIndex], ...sortedRightArrays[1]],
      [...sortedLeftArrays[2], arr3[pivotIndex], ...sortedRightArrays[2]],
      [...sortedLeftArrays[3], arr4[pivotIndex], ...sortedRightArrays[3]],
    ];
  }
function rankChange(firstName, lastName, usersRank, newRank){
    let oldRank;
    let rankPower;
    let newRankPower;
    let newRankName
    switch(newRank) {
        case "st":
          newRankPower = 0
          newRankName = "Stone"
          break;
        case "g":
            newRankPower = 4
            newRankName = "Gold"
          break;
          case "si":
            newRankName = "Silver"
            newRankPower = 3
          break;
          case "b":
            newRankPower = 2
            newRankName = "Bronze"
          break;
          case "w":
            newRankPower = 1
            newRankName = "Wood"
          break;
        default:
          newRankPower = null;
          newRankName = null;
      }
switch(usersRank) {
                case "st":
                  oldRank = "Stone"
                  rankPower = 0
                  break;
                case "g":
                    oldRank = "Gold"
                    rankPower = 4
                  break;
                  case "si":
                    oldRank = "Silver"
                    rankPower = 3
                  break;
                  case "b":
                    oldRank = "Bronze"
                    rankPower = 2
                  break;
                  case "w":
                    oldRank = "Wood"
                    rankPower = 1
                  break;
                default:
                  oldRank = null;
                  rankPower = null;
              }
              if(oldRank){
                if(rankPower < newRankPower){
                    var change = "promoted"
                }else{
                    var change = "demoted"
                }
                return firstName + " " + lastName + " was "+change+" | ``" + oldRank + " ➜ "+newRankName+"``"
              }else{
                return firstName + " " + lastName + "'s rank was changed to "+newRankName
              }


}
module.exports = {updateRankings};