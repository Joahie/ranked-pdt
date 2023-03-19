const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Displays information about the bot and its commands'),
	async execute(interaction) {
		
		const embed = new EmbedBuilder()

	.setColor(0x0099FF)
	.setTitle("About & Commands")
	.setDescription('Ranked PDT (Parliamentary Debate Tournament) is an online and informal debate league for parliamentary 1v1s. Debaters start with an elo (point system) of 1000, and gain or lose points by debating. The change in their elo is determined by the elo of their opponent and how many judges voted for them. To view the rules head to <#1085211966131404881>.')
	.addFields(
		{ name: '</register:1085225509870379101>', value: "Input your information to create your Ranked PDT account", inline: false},
		{ name: '</profile:1085225509870379100>', value: "View a debater's Ranked PDT profile (name, elo, record, etc.", inline: false},
		{ name: '</leaderboard:1085371749018906735>', value: "View the leaderboard (based on elo)", inline: false},
		{ name: '</round:1085371641044942879>', value: "View the details of a past round", inline: false},
		{ name: '</update:1085225510327566457>', value: "Report the results of a round so that the bot can update debater's elos and record. You can only use /update for rounds that you debated in. After you use the command, the bot will ask the other debater to confirm the information before updating your profiles.", inline: false},
	)
		return interaction.reply({ embeds: [embed] });
	},
};