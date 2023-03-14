const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Create your Ranked PDT Profile')
		.addStringOption(option => option.setName('first-name').setDescription('Name for profile').setRequired(true))
		.addStringOption(option => option.setName('last-name').setDescription('Name for profile').setRequired(true))
		.addStringOption(option => option.setName('club').setDescription('Debate club for profile').setRequired(true))
		.addStringOption(option => option.setName('state').setDescription('State for profile').setRequired(true)),
	async execute(interaction) {
		if(interaction.channel.id != 1085212287603843185){
			return interaction.reply({ content: "Commands only work in <#1085212287603843185>", ephemeral: true });
		}	
		const results = await mongoUsers.findOne({id: interaction.user.id})
		if(results != null){
			return interaction.reply({ content: "You already have a Ranked PDT account", ephemeral: true });
		}
		const firstName = interaction.options.getString('first-name');
		const lastName = interaction.options.getString('last-name');
		const name = firstName + " " + lastName;
		const club = interaction.options.getString('club');
		const state = interaction.options.getString('state');
		const d = new Date();
		const month = d.getMonth() + 1
		const dateFormatted = month + "/" + d.getDate() + "/" + d.getFullYear();
		await mongoUsers.insertOne({id: interaction.user.id, firstName: firstName, lastName: lastName, club: club, state: state, dateJoined: dateFormatted, elo: 1000, wins: 0, losses: 0})
		const embed = new EmbedBuilder()
		
	.setColor(0x0099FF)
	.setTitle(name + "'s Ranked PDT Profile")
	.addFields(
		{ name: 'Elo', value: '1000', inline: true},
		{ name: 'Club', value: club, inline: true },
		{ name: 'State', value: state, inline: true },
		{ name: 'Win-Loss Record', value: "0-0", inline: true },
		{ name: 'Date joined', value: dateFormatted, inline: true },
	)
	.setTimestamp();
	
		var role= interaction.member.guild.roles.cache.find(role => role.name === "Debater");
		interaction.member.roles.add(role);
		interaction.channel.send({ embeds: [embed] });
		return interaction.reply({ content: "Your profile has been successfully created!", ephemeral: false });
	},
};
