const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Displays information about the bot and its commands'),
	async execute(interaction) {
		try{
		const embed = new EmbedBuilder()

	.setTitle("About & Commands")
	.setDescription('Ranked PDT (Parliamentary Debate Tournament) is an online and unofficial debate league for parliamentary 1v1s and 2v2s. Debaters start with an elo (point system) of 1000, and gain or lose points by debating. The change in their elo is determined by the elo of their opponent and how many judges voted for them. To view the rules head to <#1085211966131404881>.')
	.addFields(
		{ name: '</register:1085225509870379101>', value: "Input your information to create your Ranked PDT account", inline: false},
		{ name: '</profile:1085225509870379100>', value: "View a debater's Ranked PDT profile (name, elo, record, etc.", inline: false},
		{ name: '</leaderboard:1085371749018906735>', value: "View the leaderboard (based on elo)", inline: false},
		{ name: '</qualified-leaderboard:1093725727154786426>', value: "View the leaderboard with only qualified debaters (3 or more wins)", inline: false},
    { name: '</judging-leaderboard:1216253338161778800>', value: "View the judging leaderboard to see who's judged the most rounds", inline: false},
		{ name: '</round:1085371641044942879>', value: "View the details of a round", inline: false},
		{ name: '</what-if:1087123478878109766>', value: "Tells debaters the change in elo that would occur based off of the results of a hypothetical round", inline: false},
		{ name: '</update:1085225510327566457>', value: "Report the results of a round so that the bot can update debater's elos and record. You can only use /update for rounds that you debated in. After you use the command, the bot will ask the other debater(s) to confirm the results before updating your profiles.", inline: false},
		{ name: '</judged:1087559386223874109>', value: "Gain a 1.2x elo boost for judging a round and 1 judging point for the end of season judging reward. This boost will be used up in your next round. If you win that round you'll gain 1.2x more elo, and if you lose you'll lose the same amount of elo.", inline: false},

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
