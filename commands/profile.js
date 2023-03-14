const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('View a Ranked PDT profile')
		.addUserOption(option => option.setName('target').setDescription('The user')),
	async execute(interaction) {
		if(interaction.channel.id != 1085212287603843185){
			return interaction.reply({ content: "Commands only work in <#1085212287603843185>", ephemeral: true });
		}		const target = interaction.options.getUser('target');
		
		if(target==null){
			const results = await mongoUsers.findOne({id: interaction.user.id})
			if(results == null){
				return interaction.reply({ content: "You don't have a Ranked PDT account", ephemeral: true });
			}
			var name = results.firstName +" "+ results.lastName;
			var elo = results.elo + "";
			var club = results.club;
			var wins = results.wins;
			var losses = results.losses;
			var wlr = wins + "-" + losses;
			var state = results.state;
			var dateJoined = results.dateJoined;
		}else{
			const results = await mongoUsers.findOne({id: target.id})
			if(results == null){
				return interaction.reply({ content: target.username  + " doesn't have a Ranked PDT account", ephemeral: true });
			}
			var name = results.firstName +" "+  results.lastName;
			var elo = results.elo + "";
			var club = results.club;
			var wins = results.wins;
			var losses = results.losses;
			var wlr = wins + "-" + losses;
			var state = results.state;
			var dateJoined = results.dateJoined;		}
		const embed = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle(name + "'s Ranked PDT Profile")
	.addFields(
		{ name: 'Elo', value: elo, inline: true},
		{ name: 'Club', value: club, inline: true },
		{ name: 'State', value: state, inline: true },
		{ name: 'Win-Loss Record', value: wlr, inline: true },
		{ name: 'Date joined', value: dateJoined, inline: true },

	)
	.setTimestamp();
		return interaction.reply({ embeds: [embed] });
	},
};
