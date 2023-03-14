const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const mongoRounds = mongoclient.db("RankedPDT").collection("rounds");

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('update')
		.setDescription('Report a round that you debated in/judged to update elo')
		.addUserOption(option => option.setName('government-team').setDescription('Debater on the government team').setRequired(true))
		.addUserOption(option => option.setName('opposition-team').setDescription('Debater on the opposition team').setRequired(true))
		.addIntegerOption(option => option.setName('government-votes').setDescription('Number of judges who voted government').setRequired(true))
		.addIntegerOption(option => option.setName('opposition-votes').setDescription('Number of judges who voted opposition').setRequired(true))
		.addStringOption(option => option.setName('resolution').setDescription('The resolution that was debated').setRequired(true)),
	async execute(interaction) {
		if(interaction.channel.id != 1085212287603843185){
			return interaction.reply({ content: "Commands only work in <#1085212287603843185>", ephemeral: true });
		}		
		var gov = interaction.options.getUser('government-team');
		var opp = interaction.options.getUser('opposition-team');
		var govVotes = interaction.options.getInteger('government-votes');
		var oppVotes = interaction.options.getInteger('opposition-votes');
		var resolution = interaction.options.getString('resolution');
		var totalVotes = govVotes + oppVotes;
		if(gov.id == opp.id){
			return interaction.reply({ content: "The government and opposition teams cannot be the same user", ephemeral: true });
		}
		var govDB = await mongoUsers.findOne({id: gov.id})
		var oppDB = await mongoUsers.findOne({id: opp.id})
		if(govDB == null && oppDB == null){
			return interaction.reply({ content: gov.username  + " and " + opp.username + " don't have Ranked PDT accounts", ephemeral: true });
		}
		if(govDB == null){
			return interaction.reply({ content: gov.username + " doesn't have a Ranked PDT account", ephemeral: true });
		}
		if(oppDB == null){
			return interaction.reply({ content: opp.username + " doesn't have a Ranked PDT account", ephemeral: true });
		}
		if(govVotes < 0 || oppVotes < 0){
			return interaction.reply({ content: "You can't have a negative number of votes for a team", ephemeral: true });
		}
		if((totalVotes % 2) != 1){
			return interaction.reply({ content: "The total number of judges needs to be odd", ephemeral: true });
		}
		oppVotes = oppVotes + ""
		govVotes = govVotes + ""
		var amountOfRounds = await mongoRounds.count() + 1;
		var roundID = ("0000" + amountOfRounds).slice(-5);
		var govFullName = govDB.firstName + " " + govDB.lastName;
		var oppFullName = oppDB.firstName + " " + oppDB.lastName;
		const d = new Date();
		const month = d.getMonth() + 1
		const dateFormatted = month + "/" + d.getDate() + "/" + d.getFullYear();
		await mongoRounds.insertOne({id: roundID, govDebater: gov.id, oppDebater: opp.id, govVotes: govVotes, oppVotes: oppVotes, resolution: resolution, date: dateFormatted})
		const embed = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle("Round #" + roundID)
	.addFields(
		{ name: 'Government Team', value: govFullName, inline: true},
		{ name: 'Opposition Team', value: oppFullName, inline: true},
		{ name: 'Government Votes', value: govVotes, inline: true},
		{ name: 'Opposition Votes', value: oppVotes, inline: true},
		{ name: 'Resolution', value: resolution, inline: true},
		{ name: 'Date', value: dateFormatted, inline: true},
	)
	.setTimestamp();
		return interaction.reply({ embeds: [embed] });
	},
};
