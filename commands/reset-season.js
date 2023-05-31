const { SlashCommandBuilder } = require('discord.js');
const {  ActionRowBuilder, ButtonBuilder, ButtonStyle, Events , EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const crypto = require('crypto');
module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('reset-season')
		.setDescription('Admin command to reset elo and seasonal stuff')
		.addIntegerOption(option => option.setName('password').setDescription('Password for reset').setRequired(true))
        .setDefaultMemberPermissions(0),
	async execute(interaction) {
			var password = interaction.options.getInteger('password');
            if(password == 123456){
                const results = await mongoUsers.find({}).toArray();
                for(i = 0; i<results.length;i++){
                    let id = results[i].id;
                    await mongoUsers.updateOne({id: id}, {$set:{wins: 0, losses: 0, elo: 1000, rank: "st", topElo: 1000, diamond: false}})
                }
                return interaction.reply({ content: "Done"});
            }else{
				return interaction.reply({ content: "Incorrect password"});
            }   	
	},
};
