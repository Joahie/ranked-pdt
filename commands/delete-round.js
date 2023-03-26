const { SlashCommandBuilder } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle,  EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const mongoRounds = mongoclient.db("RankedPDT").collection("rounds");
const crypto = require('crypto');

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('delete-round')
		.setDescription('Delete a round')
		.addIntegerOption(option => option.setName('round-id').setDescription("The ID of the round that you'd like to delete").setRequired(true))
		.setDefaultMemberPermissions(0),
	async execute(interaction) {
		try{
		var uuid = crypto.randomUUID()
		
		var roundID = interaction.options.getInteger('round-id');
		var results = await mongoRounds.findOne({id: roundID})
		var displayID = results.displayID
		if(results == null){
			return interaction.reply({ content: "This round doesn't exist. Try making sure that you inputted the correct ID.", ephemeral: true });
		}

		var row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('delete' + uuid)
					.setLabel('Delete')
					.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()

					.setCustomId('cancel' + uuid)
					.setLabel('Cancel')
					.setStyle(ButtonStyle.Secondary),
			);
			var greyOut = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('delete' + uuid)
					.setLabel('Delete')
					.setStyle(ButtonStyle.Danger)
					.setDisabled(true),
					new ButtonBuilder()

					.setCustomId('cancel' + uuid)
					.setLabel('Cancel')
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true),
			);
		var gov = await mongoUsers.findOne({id: results.govDebater})
		var opp = await mongoUsers.findOne({id: results.oppDebater})
		if(opp == null && gov == null){
			return interaction.reply({ content: "Neither debaters have Ranked PDT accounts anymore.", ephemeral: true });
		}
		if(gov == null){
			return interaction.reply({ content: "The government debater no longer has a Ranked PDT account.", ephemeral: true });
		}
		if(opp == null){
			return interaction.reply({ content: "The opposition debater no longer has a Ranked PDT account.", ephemeral: true });
		}
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
	await interaction.reply({ embeds: [embed], components:[row] });
	
	var filter = i => {
		if(i.customId != deleteId && i.customId != cancelId){
			return false;
		}
	   if(i.user.id == interaction.user.id) return true;
	   else {
		 i.reply({content: "You don't have permission to use this command", ephemeral: true});
		 return false;
	   }
	 }
var deleteId = "delete" +  uuid;
var cancelId = "cancel" +  uuid;
   var collector = interaction.channel.createMessageComponentCollector({ filter, time: 900000 });
   collector.on('collect', async i => {	
		   await i.update({components: [greyOut] });
		   if(i.customId == deleteId){
				var findRound = await mongoRounds.findOne({id: roundID});
				if(findRound == null){
					return interaction.followUp({content: "Round #" + displayID + " has already been deleted.", ephemeral: true})
				}
				var govProfile = await mongoUsers.findOne({id: findRound.govDebater});
				var oppProfile = await mongoUsers.findOne({id: findRound.oppDebater});
				var newGovElo = govProfile.elo - findRound.govEloChange;
				var newOppElo = oppProfile.elo - findRound.oppEloChange;
				if(findRound.winner == findRound.govDebater){
					var newGovWins = govProfile.wins - 1;
					var newGovLosses = govProfile.losses;
					var newOppWins = oppProfile.wins;
					var newOppLosses = oppProfile.losses - 1;
				}else{
					var newGovWins = govProfile.wins;
					var newGovLosses = govProfile.losses - 1;
					var newOppWins = oppProfile.wins - 1;
					var newOppLosses = oppProfile.losses;
				}
				await mongoUsers.updateOne({id: findRound.govDebater}, {$set:{elo: newGovElo, wins: newGovWins,losses:newGovLosses}});
				await mongoUsers.updateOne({id: findRound.oppDebater}, {$set:{elo: newOppElo, wins: newOppWins,losses:newOppLosses}});		
				await mongoRounds.deleteOne({id: roundID});		
				return interaction.followUp({content:"The results of round #"+displayID+" have been deleted"});
		   }else if(i.customId == cancelId){
			   return interaction.followUp({content:"The request to delete round #"+displayID+" has been cancelled"});
		   }
   });
   collector.on('end', async collected => {

	   if(collected.size == 0){
		   await interaction.editReply({components: [greyOut] });
		   return interaction.followUp({content:"The request to delete round #"+displayID+" has timed out and been cancelled"});  

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
