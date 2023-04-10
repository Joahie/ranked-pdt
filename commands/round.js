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
		console.log(results.govDebater)
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
		if(results.govChangeHighElo){
			let oldGovElo = results.govElo - results.govEloChange;
			var govChangeHighElo = "\n" +govFullName + " has a new highest elo [" + oldGovElo + " ➜ " + results.govElo + "]"
		}else{
			var govChangeHighElo = ""
		}
		if(results.oppChangeHighElo){
			let oldOppElo = results.oppElo - results.oppEloChange;
			var oppChangeHighElo = "\n" +oppFullName + " has a new highest elo [" + oldOppElo + " ➜ " + results.oppElo + "]"
		}else{
			var oppChangeHighElo = ""
		}
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
			var govTeamEmbed = "Debater: " + govFullName + " (<@"+results.govDebater+">)\nVotes: " + results.govVotes + "\nElo: +"+Math.floor(results.govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(results.govElo)+"]" + govBoost + govChangeHighElo;
		}else{
			var govTeamEmbed = "Debater: " + govFullName + " (<@"+results.govDebater+">)\nVotes: " + results.govVotes + "\nElo: "+Math.floor(results.govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(results.govElo)+"]"  + govBoost + govChangeHighElo;
		}
		if(results.oppEloChange*1 > 0){
			var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+results.oppDebater+">)\nVotes: " + results.oppVotes + "\nElo: +"+Math.floor(results.oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(results.oppElo)+"]" + oppBoost + oppChangeHighElo;
		}else{
			var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+results.oppDebater+">)\nVotes: " + results.oppVotes + "\nElo: "+Math.floor(results.oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(results.oppElo)+"]" + oppBoost + oppChangeHighElo;
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
