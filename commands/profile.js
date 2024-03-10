const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");

module.exports = {

  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription("View a debater's Ranked PDT profile")
    .addUserOption(option => option.setName('target').setDescription('The user')),
  async execute(interaction) {
    try{
      const target = interaction.options.getUser('target');
    if(target==null){
      var results = await mongoUsers.findOne({id: interaction.user.id})
      if(results == null){
        return interaction.reply({ content: "You don't have a Ranked PDT account", ephemeral: true });
      }
      if(results.deleted){
        return interaction.reply({ content: "This user's Ranked PDT account has been deleted", ephemeral: true });
      }
      var name = results.firstName +" "+ results.lastName;
      var elo = results.elo*1;
      elo = Math.floor(results.elo)
      elo =  elo + ""
      var eloBoosts = results.eloBoosts + "";
      var judged = results.judged + "";
      var club = results.club;
      var wins = results.wins;
      var losses = results.losses;
      var wlr = wins + "-" + losses;
      var state = results.state;
      var dateJoined = results.dateJoined;
      var topElo = Math.floor(results.topElo);
      var topEloLifetime = Math.floor(results.topEloLifetime);
      var rank = results.rank;
      var diamond = results.diamond;
      var color;
switch(rank) {
  case "st":
    rank = "Stone"
    color = "888c8d";
    break;
  case "g":
    rank = "Gold"
    color = "ffd700"
    break;
    case "si":
    rank = "Silver"
    color = "c0c0c0"
    break;
    case "b":
    rank = "Bronze"
    color = "cd7f32";
    break;
    case "w":
    rank = "Wood"
    color = "966f33"
    break;
  default:
    rank = null;
    color = "888c8d";
  }
  if(diamond){
  rank = "Diamond";
  color = "4ee2ec";
}

      topElo = topElo + ""
      topEloLifetime = topEloLifetime + ""

    const results1 =  await mongoUsers.find({ $or: [ { wins: { $gt: 0 } }, { losses: { $gt: 0 } } ] , deleted: {$ne: true}}).toArray()
    var eloArray = [];
    var idArray = [];
    for(i = 0; i<results1.length; i++){
      eloArray.push(results1[i].elo)
      idArray.push(results1[i].id)
    }

    function quickSort(arr1, arr2, left = 0, right = arr1.length - 1) {
      if (left >= right) {
        return;
      }
      let pivotIndex = Math.floor((left + right) / 2);
      let pivotValue = arr1[pivotIndex];
      let i = left;
      let j = right;
      while (i <= j) {
        while (arr1[i] > pivotValue) {
          i++;
        }
        while (arr1[j] < pivotValue) {
          j--;
        }
        if (i <= j) {
          [arr1[i], arr1[j]] = [arr1[j], arr1[i]];
          [arr2[i], arr2[j]] = [arr2[j], arr2[i]];
          i++;
          j--;
        }
      }
      quickSort(arr1, arr2, left, j);
      quickSort(arr1, arr2, i, right);
    }

    quickSort(eloArray, idArray)
    var prevRanking;
    var prevElo;

    for(i = 1; i <= eloArray.length; i++){
      if(i == 1){
        if(interaction.user.id == idArray[i-1]){
          var ranking = 1;
        }
        prevRanking = i;
      }else{
        if(prevElo == eloArray[i-1]){
          if(interaction.user.id == idArray[i-1]){
            var ranking = prevRanking;
          }
        }else{
          prevRanking = i;
          if(interaction.user.id == idArray[i-1]){
            var ranking = i;
          }
        }
      }
      prevElo = eloArray[i-1]	
    }

  }else{
      var results = await mongoUsers.findOne({id: target.id})
      if(results == null){
        return interaction.reply({ content: target.username  + " doesn't have a Ranked PDT account", ephemeral: true });
      }
            if(results.deleted){
        return interaction.reply({ content: "This user's Ranked PDT account has been deleted", ephemeral: true });
      }
      var eloBoosts = results.eloBoosts + "";
      var judged = results.judged + "";
      var topElo = Math.floor(results.topElo);
      topElo = topElo + ""
      var topEloLifetime = Math.floor(results.topEloLifetime);
      topEloLifetime = topEloLifetime + ""

      var name = results.firstName +" "+  results.lastName;
      var elo = results.elo*1;
      elo = Math.floor(results.elo)
      elo =  elo + ""
      var club = results.club;
      var wins = results.wins;
      var losses = results.losses;
      var wlr = wins + "-" + losses;
      var state = results.state;
      var dateJoined = results.dateJoined;		
      const results1 = await mongoUsers.find({ $or: [ { wins: { $gt: 0 } }, { losses: { $gt: 0 } } ] , deleted: {$ne: true}}).toArray()
      var eloArray = [];
      var idArray = [];
      var rank = results.rank;
      var diamond = results.diamond;
      var color;
switch(rank) {
  case "st":
    rank = "Stone"
    color = "888c8d";
    break;
  case "g":
    rank = "Gold"
    color = "ffd700"
    break;
    case "si":
    rank = "Silver"
    color = "c0c0c0"
    break;
    case "b":
    rank = "Bronze"
    color = "cd7f32";
    break;
    case "w":
    rank = "Wood"
    color = "966f33"
    break;
  default:
    rank = null;
    color = "888c8d";
  }
  if(diamond){
  rank = "Diamond";
  color = "4ee2ec";
}

      for(i = 0; i<results1.length; i++){
        eloArray.push(results1[i].elo)
        idArray.push(results1[i].id)
      }

      function quickSort(arr1, arr2, left = 0, right = arr1.length - 1) {
        if (left >= right) {
          return;
        }
        let pivotIndex = Math.floor((left + right) / 2);
        let pivotValue = arr1[pivotIndex];
        let i = left;
        let j = right;
        while (i <= j) {
          while (arr1[i] > pivotValue) {
            i++;
          }
          while (arr1[j] < pivotValue) {
            j--;
          }
          if (i <= j) {
            [arr1[i], arr1[j]] = [arr1[j], arr1[i]];
            [arr2[i], arr2[j]] = [arr2[j], arr2[i]];
            i++;
            j--;
          }
        }
        quickSort(arr1, arr2, left, j);
        quickSort(arr1, arr2, i, right);
      }

      quickSort(eloArray, idArray)
      var prevRanking;
      var prevElo;
      for(i = 1; i <= eloArray.length; i++){
        if(i == 1){

          if( target.id == idArray[i-1]){
            var ranking = 1;
          }
          prevRanking = i;
        }else{
          if(prevElo == eloArray[i-1]){
            if( target.id == idArray[i-1]){
              var ranking = prevRanking;
            }
          }else{
            prevRanking = i;
            if( target.id == idArray[i-1]){
              var ranking = i;
            }
          }
        }
        prevElo = eloArray[i-1]	
      }
    }


    ranking = "#"+ ranking
      if(results.wins == 0 && results.losses == 0){
        ranking = "This user hasn't competed"
      }
    const embed = new EmbedBuilder()
  .setColor(color)
  .setTitle(name + "'s Ranked PDT Profile")
  .addFields(
    { name: 'Elo', value: elo, inline: true},
    { name: 'Highest Elo (Lifetime)', value: topEloLifetime, inline: true },
    { name: 'Highest Elo (Seasonal)', value: topElo, inline: true },
    { name: 'Elo Boosts (1.2x)', value: eloBoosts, inline: true },
    { name: 'Rounds Judged', value: judged, inline: true },
    { name: 'Rank', value: ranking, inline: true },
    { name: 'Record', value: wlr, inline: true },
    { name: 'Club', value: club, inline: true },
    { name: 'State', value: state, inline: true },
  )
  .setFooter({ text: 'Joined '  + dateJoined })

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
var today = new Date();
var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
var dateTime = date+' '+time;

console.log("Date: " + dateTime)
console.log("User ID:" + interaction.user.id)
          return interaction.reply({ content: 'There was an error while executing this command!'});

}
  },
};
