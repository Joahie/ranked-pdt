const { SlashCommandBuilder } = require('discord.js');
const {  ActionRowBuilder, ButtonBuilder, ButtonStyle, Events , EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const crypto = require('crypto');
module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('judged')
		.setDescription('Command to claim elo boost for judging')
		.addUserOption(option => option.setName('government-team').setDescription('Debater on the government team').setRequired(true))
		.addUserOption(option => option.setName('opposition-team').setDescription('Debater on the opposition team').setRequired(true))
		.addStringOption(option => option.setName('resolution').setDescription('The resolution that was debated').setRequired(true)),
	async execute(interaction) {
		try{
		var gov = interaction.options.getUser('government-team');
		var opp = interaction.options.getUser('opposition-team');
		var resolution = interaction.options.getString('resolution');		
		var govDB = await mongoUsers.findOne({id: gov.id})
		var oppDB = await mongoUsers.findOne({id: opp.id})
		var judgeDB = await mongoUsers.findOne({id: interaction.user.id})
if(judgeDB == null){
	return interaction.reply({ content: "You don't have a Ranked PDT profile", ephemeral: true });

}
if(govDB.deleted || oppDB.deleted){
	return interaction.reply({ content: "At least one of these user's accounts has been deleted", ephemeral: true });

}
		if(gov.id == interaction.user.id || opp.id == interaction.user.id){
			return interaction.reply({ content: "You can't judge yourself", ephemeral: true });
		}
		if(gov.id == opp.id){
			return interaction.reply({ content: "The debaters can't be the same person", ephemeral: true });
		}
		if(oppDB == null && govDB == null) {
			return interaction.reply({ content: "Neither of these debaters have Ranked PDT accounts", ephemeral: true });
		}
		if(govDB == null){
			return interaction.reply({ content: gov.username + " doesn't have a Ranked PDT account", ephemeral: true });
		}
		if(oppDB == null){
			return interaction.reply({ content: opp.username + " doesn't have a Ranked PDT account", ephemeral: true });
		}
		var govTeamName = govDB.firstName + " " + govDB.lastName
		var oppTeamName = oppDB.firstName + " " + oppDB.lastName
		const confirmationEmbed = new EmbedBuilder()

		.setTitle("Judging Confirmation")
		.setDescription('Resolution: ' + resolution)
		.addFields(
			{ name: 'Government Team', value: govTeamName, inline: false},
			{ name: 'Opposition Team', value: oppTeamName, inline: false},
		)
		var uuid = crypto.randomUUID()

		var row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('confirm' + uuid)
					.setLabel('Confirm')
					.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()

					.setCustomId('cancel' + uuid)
					.setLabel('Deny')
					.setStyle(ButtonStyle.Danger),
			);
			var greyOut = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('confirm' + uuid)
					.setLabel('Confirm')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(true),
					new ButtonBuilder()

					.setCustomId('cancel' + uuid)
					.setLabel('Deny')
					.setStyle(ButtonStyle.Danger)
					.setDisabled(true),
			);
			var confirmId = "confirm" + uuid
			var cancelId = "cancel" + uuid
		 await interaction.reply({embeds: [confirmationEmbed], components: [row]})
		 interaction.channel.send({content: "<@"+gov.id+"> "+ "<@"+opp.id+"> please confirm or deny this information. If neither of you respond within 15 minutes, the results will be automatically validated."})
		 var filter = i => {
			if(i.customId != confirmId && i.customId != cancelId){
				return false;
			}
			if(i.user.id == gov.id || i.user.id == opp.id) return true;
			else {
			  i.reply({content: "Only " + govTeamName + " or " + oppTeamName+" can confirm or deny this information", ephemeral: true});
			  return false;
			}
		  }

		var collector = interaction.channel.createMessageComponentCollector({ filter, time: 890000 });
		
		collector.on('collect', async i => {
			await i.update({components: [greyOut] });
			await interaction.channel.send({content: "<@"+ i.user.id+"> verified the results of <@" +interaction.user.id+ ">'s judging report."})

			if(i.customId === confirmId){
				var eloBoosts = judgeDB.eloBoosts + 1;

		const embed = new EmbedBuilder()

		.setTitle("Judging Elo")
		.setDescription('<@'+interaction.user.id+'> has gained an elo boost for judging a round. They now have ' + eloBoosts + " boosts.")
		.addFields(
			{ name: 'Government Team', value: govTeamName, inline: false},
			{ name: 'Opposition Team', value: oppTeamName, inline: false},
			{ name: 'Resolution', value: resolution, inline: false},		)
		await mongoUsers.updateOne({id: interaction.user.id},{$set:{eloBoosts: eloBoosts}})

		return interaction.channel.send({ embeds: [embed]});
	}	
	if(i.customId === cancelId){
		return interaction.followUp({content:"The judging report submitted by <@"+interaction.user.id+"> have been denied by <@"+i.user.id+">"})
	}

		});
		
		collector.on('end', async collected => {

			if(collected.size == 0){
				await interaction.editReply({components: [greyOut] });
				await interaction.channel.send({content: "None of the debaters responded within 15 minutes, so <@" +interaction.user.id+ ">'s judging report has been automatically validated."})
				var eloBoosts = judgeDB.eloBoosts + 1;

				const embed = new EmbedBuilder()
		
				.setTitle("Judging Elo")
				.setDescription('<@'+interaction.user.id+'> has gained an elo boost for judging a round. They now have ' + eloBoosts + " boosts.")
				.addFields(
					{ name: 'Government Team', value: govTeamName, inline: false},
					{ name: 'Opposition Team', value: oppTeamName, inline: false},
					{ name: 'Resolution', value: resolution, inline: false},		)
				await mongoUsers.updateOne({id: interaction.user.id},{$set:{eloBoosts: eloBoosts}})
		
		return interaction.channel.send({ embeds: [embed]});
			}
		});
		
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
