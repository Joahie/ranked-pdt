const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
//const mongoUsers = mongoclient.db("RankedPDT").collection("users");

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('create-profile')
		.setDescription('Create your Ranked PDT Profile')
		.addStringOption(option => option.setName('first-name').setDescription('Name for profile').setRequired(true))
		.addStringOption(option => option.setName('last-name').setDescription('Name for profile').setRequired(true))
		.addStringOption(option => option.setName('club').setDescription('Debate club for profile').setRequired(true))
		.addStringOption(option => option.setName('state').setDescription('State for profile').setRequired(true)),
	async execute(interaction) {
		const firstName = interaction.options.getString('first-name');
		const lastName = interaction.options.getString('last-name');
		const name = firstName + " " + lastName;
		const club = interaction.options.getString('club');
		const state = interaction.options.getString('state');
		//await mongoUsers.insertOne({name: "f"})
		const exampleEmbed = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle(name + "'s Ranked PDT Profile")
	.addFields(
		{ name: 'Elo', value: '1000', inline: true},
		{ name: 'Club', value: club, inline: true },
		{ name: 'State', value: state, inline: true },
	)
	.setTimestamp();
		console.log("BRUH");

		interaction.channel.send({ embeds: [exampleEmbed] });
		return interaction.reply({ content: "Your profile has been successfully created!", ephemeral: false });
	},
};
