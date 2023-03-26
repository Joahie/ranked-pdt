const { SlashCommandBuilder } = require('discord.js');
const {  ActionRowBuilder, ButtonBuilder, ButtonStyle, Events , EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const mongoRounds = mongoclient.db("RankedPDT").collection("rounds");
const crypto = require('crypto');
module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('judged')
		.setDescription('Admin command for giving judges 10 elo')
		.addUserOption(option => option.setName('judge').setDescription('The person that judged').setRequired(true))
		.addStringOption(option => option.setName('round-details').setDescription('Debaters/resolution/id for record keeping reasons').setRequired(true)),
	async execute(interaction) {
		var judge = interaction.options.getUser('judge');
		var details = interaction.options.getString('round-details');		
		var judgeDB = await mongoUsers.findOne({id: judge.id})
		if(judgeDB == null){
			return interaction.reply({ content: judge.username + " doesn't have a Ranked PDT account", ephemeral: true });
		}
		const embed = new EmbedBuilder()

		.setColor(0x0099FF)
		.setTitle("Judging Elo")
		.setDescription('<@'+judge.id+'> gained 10 elo from judging a round')
		.addFields(
			{ name: 'Details', value: details, inline: false},
		)
		var elo = judgeDB.elo;
		var newElo = elo + 10;
		console.log(newElo)
		await mongoUsers.updateOne({id: judge.id},{$set:{elo: newElo}})
		return interaction.reply({ embeds: [embed]});		
		
	
	},
};
