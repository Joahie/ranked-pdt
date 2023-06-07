const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const mongoRounds = mongoclient.db("RankedPDT").collection("rounds");

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('round')
		.setDescription('View the details of a past round')
		.addIntegerOption(option => option.setName('round-id').setDescription("The ID of the round that you'd like to view").setRequired(true)),
	async execute(interaction) {
		try{
		var roundID = interaction.options.getInteger('round-id');
		var results = await mongoRounds.findOne({id: roundID})
		if(results == null){
			return interaction.reply({ content: "This round doesn't exist. Try making sure that you inputted the correct ID.", ephemeral: true });
		}
		if(results.govDebater == null){
			var gov1 = await mongoUsers.findOne({id: results.govDebater1})
			var gov2 = await mongoUsers.findOne({id: results.govDebater2})
			var opp1 = await mongoUsers.findOne({id: results.oppDebater1})
			var opp2 = await mongoUsers.findOne({id: results.oppDebater2})
			if(opp1 == null || opp2 == null || gov1 == null || gov2 == null){
				return interaction.reply({ content: "At least one of the debaters no longer has a Ranked PDT account.", ephemeral: true });
			}
			var govFullName1 = gov1.firstName + " " + gov1.lastName
			var oppFullName1 = opp1.firstName + " " + opp1.lastName
			var govFullName2 = gov2.firstName + " " + gov2.lastName
			var oppFullName2 = opp2.firstName + " " + opp2.lastName
			var originalGovElo1 = results.govElo1 - results.govEloChange1;
			var originalOppElo1 = results.oppElo1 - results.oppEloChange1;
			var originalGovElo2 = results.govElo2 - results.govEloChange2;
			var originalOppElo2 = results.oppElo2 - results.oppEloChange2;
			let govArray = [gov1.lastName, gov2.lastName]
			govArray.sort()
			var govTeamName = govArray[0] + "/" + govArray[1]
			if(gov1.lastName == govArray[0]){
				var govTeamNamePing = "<@" + gov1.id + ">/<@"+gov2.id+">"
				var govName1 = gov1.firstName + " " + gov1.lastName
				var govName2 = gov2.firstName + " " + gov2.lastName
			}else{
				var govTeamNamePing = "<@" + gov2.id + ">/<@"+gov1.id+">"
				var govName2= gov1.firstName + " " + gov1.lastName
				var govName1 = gov2.firstName + " " + gov2.lastName
			}
			let oppArray = [opp1.lastName, opp2.lastName]
			oppArray.sort()
			var oppTeamName = oppArray[0] + "/" + oppArray[1]
			if(opp1.lastName == oppArray[0]){
				var oppTeamNamePing = "<@" + opp1.id + ">/<@"+opp2.id+">"
				var oppName1 = opp1.firstName + " " + opp1.lastName
				var oppName2 = opp2.firstName + " " + opp2.lastName
			}else{
				var oppTeamNamePing = "<@" + opp2.id + ">/<@"+opp1.id+">"
				var oppName2 = opp1.firstName + " " + opp1.lastName
				var oppName1 = opp2.firstName + " " + opp2.lastName
			}
			if(results.govBoost){
				var govEloBoost = "\n" +results.govBoosterName  + " used an elo boost"
			}else{
				var govEloBoost = ""
			}
			if(results.oppBoost){
				var oppEloBoost = "\n" +results.oppBoosterName  + " used an elo boost"
			}else{
				var oppEloBoost = ""
			}
			if(results.govEloChange*1 > 0){
				var govTeamEmbed = "Team: " + govTeamName + " ("+govTeamNamePing+")\nVotes: " + results.govVotes + govEloBoost
				var govDebaterEmbed1 = "\nElo: +"+Math.floor(results.govEloChange1) + " ["+Math.floor(results.govElo1-results.govEloChange1)+" ➜ " +Math.floor(results.govElo1)+"]"
				var govDebaterEmbed2 = "\nElo: +"+Math.floor(results.govEloChange2) + " ["+Math.floor(results.govElo2-results.govEloChange2)+" ➜ " +Math.floor(results.govElo2)+"]"
			}else{
				var govTeamEmbed = "Team: " + govTeamName + " ("+govTeamNamePing+")\nVotes: " + results.govVotes + govEloBoost
				var govDebaterEmbed1 = "\nElo: "+Math.floor(results.govEloChange1) + " ["+Math.floor(results.govElo1-results.govEloChange1)+" ➜ " +Math.floor(results.govElo1)+"]"
				var govDebaterEmbed2 = "\nElo: "+Math.floor(results.govEloChange2) + " ["+Math.floor(results.govElo2-results.govEloChange2)+" ➜ " +Math.floor(results.govElo2)+"]"
			}
			if(results.oppEloChange*1 > 0){
				var oppTeamEmbed = "Team: " + oppTeamName + " ("+oppTeamNamePing+")\nVotes: " + results.oppVotes + oppEloBoost
				var oppDebaterEmbed1 = "\nElo: +"+Math.floor(results.oppEloChange1) + " ["+Math.floor(results.oppElo1-results.oppEloChange1)+" ➜ " +Math.floor(results.oppElo1)+"]"
				var oppDebaterEmbed2 = "\nElo: +"+Math.floor(results.oppEloChange2) + " ["+Math.floor(results.oppElo2-results.oppEloChange2)+" ➜ " +Math.floor(results.oppElo2)+"]"
			}else{
				var oppTeamEmbed = "Team: " + oppTeamName + " ("+oppTeamNamePing+")\nVotes: " + results.oppVotes + oppEloBoost
				var oppDebaterEmbed1 = "\nElo: "+Math.floor(results.oppEloChange1) + " ["+Math.floor(results.oppElo1-results.oppEloChange1)+" ➜ " +Math.floor(results.oppElo1)+"]"
				var oppDebaterEmbed2 = "\nElo: "+Math.floor(results.oppEloChange2) + " ["+Math.floor(results.oppElo2-results.oppEloChange2)+" ➜ " +Math.floor(results.oppElo2)+"]"
			}
			
			if(results.govVotes > results.oppVotes){
				var winnerDeclaration = govTeamName + " (" + govTeamNamePing+")"
			}else{
				var winnerDeclaration = oppTeamName + " (" + oppTeamNamePing+")"
			}
			const embed = new EmbedBuilder()
	
		.setTitle("Round #" + results.displayID)
		.setDescription('Resolution: ' + results.resolution)
		.addFields(
			{ name: 'Government Team', value: govTeamEmbed, inline: false},
			{ name: govName1, value: govDebaterEmbed1, inline: false},
			{ name: govName2, value: govDebaterEmbed2, inline: false},
			{ name: 'Opposition Team', value: oppTeamEmbed, inline: false},
			{ name: oppName1, value: govDebaterEmbed1, inline: false},
			{ name: oppName2, value: govDebaterEmbed2, inline: false},
			{ name: 'Winner', value: winnerDeclaration, inline: false},
			{ name: 'Date', value: results.date, inline: false},
	
		)
			return interaction.reply({ embeds: [embed] });
		}else{
			var gov = await mongoUsers.findOne({id: results.govDebater})
			var opp = await mongoUsers.findOne({id: results.oppDebater})
			if(opp == null && gov == null){
				return interaction.reply({ content: "Neither debaters have Ranked PDT accounts anymore.", ephemeral: true });
			}
			if(gov == null){
				return interaction.reply({ content: "The government debater no longer has a Ranked PDT account.", ephemeral: true });
			}
			if(opp == null){
				return interaction.reply({ content: "The opposition debater no longer has a Ranked PDT account.", ephemeral: true });
			}
			var govFullName = gov.firstName + " " + gov.lastName
			var oppFullName = opp.firstName + " " + opp.lastName
			var originalGovElo = results.govElo - results.govEloChange;
			var originalOppElo = results.oppElo - results.oppEloChange;
			if(results.oppBoost){
				var oppBoost = "\n" +oppFullName  + " used an elo boost."
			}else{
				var oppBoost = ""
			}
			if(results.govBoost){
				var govBoost = "\n" +govFullName  + " used an elo boost."
			}else{
				var govBoost = ""
			}
			if(results.govEloChange*1 > 0){
				var govTeamEmbed = "Debater: " + govFullName + " (<@"+results.govDebater+">)\nVotes: " + results.govVotes + "\nElo: +"+Math.floor(results.govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(results.govElo)+"]" + govBoost;
			}else{
				var govTeamEmbed = "Debater: " + govFullName + " (<@"+results.govDebater+">)\nVotes: " + results.govVotes + "\nElo: "+Math.floor(results.govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(results.govElo)+"]"  + govBoost;
			}
			if(results.oppEloChange*1 > 0){
				var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+results.oppDebater+">)\nVotes: " + results.oppVotes + "\nElo: +"+Math.floor(results.oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(results.oppElo)+"]" + oppBoost;
			}else{
				var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+results.oppDebater+">)\nVotes: " + results.oppVotes + "\nElo: "+Math.floor(results.oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(results.oppElo)+"]" + oppBoost;
			}
			if(results.govVotes > results.oppVotes){
				var winnerDeclaration = govFullName + " (<@" + gov.id+">)"
			}else{
				var winnerDeclaration = oppFullName + " (<@" + opp.id+">)"
			}
			const embed = new EmbedBuilder()
	
		.setTitle("Round #" + results.displayID)
		.setDescription('Resolution: ' + results.resolution)
		.addFields(
			{ name: 'Government Team', value: govTeamEmbed, inline: false},
			{ name: 'Opposition Team', value: oppTeamEmbed, inline: false},
			{ name: 'Winner', value: winnerDeclaration, inline: false},
			{ name: 'Date', value: results.date, inline: false},
	
		)
			return interaction.reply({ embeds: [embed] });
		}
	
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
