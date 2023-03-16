const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const mongoRounds = mongoclient.db("RankedPDT").collection("rounds");

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('delete-round')
		.setDescription('View the details of a past round')
		.addIntegerOption(option => option.setName('round-id').setDescription("The ID of the round that you'd like to view").setRequired(true)),
	async execute(interaction) {
		if(interaction.channel.id != 1085212287603843185){
			return interaction.reply({ content: "Commands only work in <#1085212287603843185>", ephemeral: true });
		}		
		var roundID = interaction.options.getInteger('round-id');
		var results = await mongoRounds.findOne({id: roundID})
		if(results == null){
			return interaction.reply({ content: "This round doesn't exist. Try making sure that you inputted the correct ID.", ephemeral: true });
		}
		console.log(results.govDebater)
		var gov = await mongoUsers.findOne({id: results.govDebater})
		var opp = await mongoUsers.findOne({id: results.oppDebater})
		var govFullName = gov.firstName + " " + gov.lastName
		var oppFullName = opp.firstName + " " + opp.lastName
		var originalGovElo = results.govElo - results.govEloChange;
		var originalOppElo = results.oppElo - results.oppEloChange;
		if(results.govEloChange*1 > 0){
			var govTeamEmbed = "Debater: " + govFullName + " (<@"+results.govDebater+">)\nVotes: " + results.govVotes + "\nElo: +"+Math.floor(results.govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(results.govElo)+"]";
		}else{
			var govTeamEmbed = "Debater: " + govFullName + " (<@"+results.govDebater+">)\nVotes: " + results.govVotes + "\nElo: "+Math.floor(results.govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(results.govElo)+"]";
		}
		if(results.oppEloChange*1 > 0){
			var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+results.oppDebater+">)\nVotes: " + results.oppVotes + "\nElo: +"+Math.floor(results.oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(results.oppElo)+"]";
		}else{
			var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+results.oppDebater+">)\nVotes: " + results.oppVotes + "\nElo: "+Math.floor(results.oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(results.oppElo)+"]";
		}
		if(results.govVotes > results.oppVotes){
			var winnerDeclaration = govFullName + " (<@" + gov.id+">)"
		}else{
			var winnerDeclaration = oppFullName + " (<@" + opp.id+">)"
		}
		const embed = new EmbedBuilder()

	.setColor(0x0099FF)
	.setTitle("Round #" + results.displayID)
	.setDescription('Resolution: ' + results.resolution)
	.addFields(
		{ name: 'Government Team', value: govTeamEmbed, inline: false},
		{ name: 'Opposition Team', value: oppTeamEmbed, inline: false},
		{ name: 'Winner', value: winnerDeclaration, inline: false},
		{ name: 'Date', value: results.date, inline: false},

	)
		return interaction.reply({ embeds: [embed] });
	},
};
