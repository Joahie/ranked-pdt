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
		if(results == null){
			return interaction.reply({ content: "This round doesn't exist. Try making sure that you inputted the correct ID.", ephemeral: true });
		}
      		var displayID = results.displayID


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
			if(!results.govDebater){
				var gov1 = await mongoUsers.findOne({id: results.govDebater1})
				var opp1 = await mongoUsers.findOne({id: results.oppDebater1})
				var gov2 = await mongoUsers.findOne({id: results.govDebater2})
				var opp2 = await mongoUsers.findOne({id: results.oppDebater2})
				if(gov1 == null || gov2 == null || opp1 == null || opp2==null){
					return interaction.reply({ content: "At least one of these debaters no longer has a Ranked PDT account.", ephemeral: true });
				}
				var govFullName1 = gov1.firstName + " " + gov1.lastName
				var oppFullName1 = opp1.firstName + " " + opp1.lastName
				var govFullName2 = gov2.firstName + " " + gov2.lastName
				var oppFullName2 = opp2.firstName + " " + opp2.lastName
				var originalGovElo1 = results.govElo1 - results.govEloChange1;
				var originalOppElo1 = results.oppElo1 - results.oppEloChange1;
				var originalGovElo2 = results.govElo2 - results.govEloChange2;
				var originalOppElo2 = results.oppElo2 - results.oppEloChange2;
				let govArray = [gov1.lastName,gov2.lastName]
				govArray.sort()
				let oppArray = [opp1.lastName,opp2.lastName]
				oppArray.sort()
				var govTeamName = govArray[0] + "/" + govArray[1]
				var oppTeamName = oppArray[0] + "/" + oppArray[1]
				if(results.govEloChange1*1 > 0){
					var govTeamEmbed = "Team: " + govTeamName + "\nVotes: " + results.govVotes + "\nElo (1): +"+Math.floor(results.govEloChange1) + " ["+Math.floor(originalGovElo1)+" ➜ " +Math.floor(results.govElo1)+"]"+ "\nElo (2): +"+Math.floor(results.govEloChange2) + " ["+Math.floor(originalGovElo2)+" ➜ " +Math.floor(results.govElo2)+"]";
				}else{
					var govTeamEmbed = "Team: " + govTeamName + "\nVotes: " + results.govVotes + "\nElo (1): "+Math.floor(results.govEloChange1) + " ["+Math.floor(originalGovElo1)+" ➜ " +Math.floor(results.govElo1)+"]"+ "\nElo (2): "+Math.floor(results.govEloChange2) + " ["+Math.floor(originalGovElo2)+" ➜ " +Math.floor(results.govElo2)+"]";				}
				if(results.oppEloChange1*1 > 0){
					var oppTeamEmbed = "Team: " + oppTeamName + "\nVotes: " + results.oppVotes + "\nElo (1): +"+Math.floor(results.oppEloChange1) + " ["+Math.floor(originalOppElo1)+" ➜ " +Math.floor(results.oppElo1)+"]"+ "\nElo (2): +"+Math.floor(results.oppEloChange2) + " ["+Math.floor(originalOppElo2)+" ➜ " +Math.floor(results.oppElo2)+"]";				
				}else{
					var oppTeamEmbed = "Team: " + oppTeamName + "\nVotes: " + results.oppVotes + "\nElo (1): "+Math.floor(results.oppEloChange1) + " ["+Math.floor(originalOppElo1)+" ➜ " +Math.floor(results.oppElo1)+"]"+ "\nElo (2): "+Math.floor(results.oppEloChange2) + " ["+Math.floor(originalOppElo2)+" ➜ " +Math.floor(results.oppElo2)+"]";				
				}
				if(results.govVotes > results.oppVotes){
					var winnerDeclaration = govTeamName
				}else{
					var winnerDeclaration = oppTeamName
				}
		
		const embed = new EmbedBuilder()
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
		   var collector = interaction.channel.createMessageComponentCollector({ filter, time: 890000 });
		   collector.on('collect', async i => {	
				   await i.update({components: [greyOut] });
				   if(i.customId == deleteId){
						var findRound = await mongoRounds.findOne({id: roundID});
						if(findRound == null){
							return interaction.followUp({content: "Round #" + displayID + " has already been deleted.", ephemeral: true})
						}
						var govProfile1 = await mongoUsers.findOne({id: findRound.govDebater1});
						var oppProfile1 = await mongoUsers.findOne({id: findRound.oppDebater1});
						var govProfile2 = await mongoUsers.findOne({id: findRound.govDebater2});
						var oppProfile2 = await mongoUsers.findOne({id: findRound.oppDebater2});
						var newGovElo1 = govProfile1.elo - findRound.govEloChange1;
						var newGovElo2 = govProfile2.elo - findRound.govEloChange2;
						var newOppElo1 = oppProfile1.elo - findRound.oppEloChange1;
						var newOppElo2 = oppProfile2.elo - findRound.oppEloChange2;
						if(findRound.govVotes > findRound.oppVotes){
							var newGovWins1 = govProfile1.wins - 1;
							var newGovLosses1 = govProfile1.losses;
							var newOppWins1 = oppProfile1.wins;
							var newOppLosses1 = oppProfile1.losses - 1;
							var newGovWins2 = govProfile2.wins - 1;
							var newGovLosses2 = govProfile2.losses;
							var newOppWins2 = oppProfile2.wins;
							var newOppLosses2 = oppProfile2.losses - 1;
						}else{
							var newGovWins1 = govProfile1.wins;
							var newGovLosses1 = govProfile1.losses - 1;
							var newOppWins1 = oppProfile1.wins - 1;
							var newOppLosses1 = oppProfile1.losses;
							var newGovWins2 = govProfile2.wins;
							var newGovLosses2 = govProfile2.losses - 1;
							var newOppWins2 = oppProfile2.wins - 1;
							var newOppLosses2 = oppProfile2.losses;
						}
				 if(results.govBoost1){
				   var newGovBoost1 = govProfile1.eloBoosts+1;
				 }else{
				   var newGovBoost1 = govProfile1.eloBoosts; 
				 }
				 if(results.govBoost2){
					var newGovBoost2 = govProfile2.eloBoosts+1;
				  }else{
					var newGovBoost2 = govProfile2.eloBoosts; 
				  }
				 if(results.oppBoost1){
				   var newOppBoost1 = oppProfile1.eloBoosts+1;
				 }else{
				   var newOppBoost1 = oppProfile1.eloBoosts; 
				 }
				 if(results.oppBoost2){
					var newOppBoost2 = oppProfile2.eloBoosts+1;
				  }else{
					var newOppBoost2 = oppProfile2.eloBoosts; 
				  }
		
				 if(results.govChangeHighElo1){
					var newGovHighElo1 = results.govOriginalSeasonalElo1;
				}else{
				   var newGovHighElo1 = govProfile1.topElo;
				 }
				 if(results.govChangeHighElo2){
					var newGovHighElo2 = results.govOriginalSeasonalElo2;
				}else{
				   var newGovHighElo2 = govProfile2.topElo;
				 }
				 if(results.govChangeHighEloLifetime1){
					var newGovHighEloLifetime1 = results.govOriginalLifetimeElo1;
				}else{
				   var newGovHighEloLifetime1 = govProfile1.topEloLifetime;
				 }
				 if(results.govChangeHighEloLifetime2){
					var newGovHighEloLifetime2 = results.govOriginalLifetimeElo2;
				}else{
				   var newGovHighEloLifetime2 = govProfile2.topEloLifetime;
				 }
				 if(results.oppChangeHighElo1){
				   var newOppHighElo1 = results.oppOriginalSeasonalElo1;
				 }else{
				   var newOppHighElo1 = oppProfile1.topElo;
				 }
				 if(results.oppChangeHighEloLifetime1){
					var newOppHighEloLifetime1 = results.oppOriginalLifetimeElo1;
				}else{
				   var newOppHighEloLifetime1 = oppProfile1.topEloLifetime;
				 }
				 if(results.oppChangeHighElo2){
					var newOppHighElo2 = results.oppOriginalSeasonalElo2;
				  }else{
					var newOppHighElo2 = oppProfile2.topElo;
				  }
				  if(results.oppChangeHighEloLifetime2){
					 var newOppHighEloLifetime2 = results.oppOriginalLifetimeElo2;
				 }else{
					var newOppHighEloLifetime2 = oppProfile2.topEloLifetime;
				  }
		
						await mongoUsers.updateOne({id: findRound.govDebater1}, {$set:{elo: newGovElo1, wins: newGovWins1,losses:newGovLosses1, eloBoosts: newGovBoost1, topElo: newGovHighElo1, topEloLifetime: newGovHighEloLifetime1}});
						await mongoUsers.updateOne({id: findRound.govDebater2}, {$set:{elo: newGovElo2, wins: newGovWins2,losses:newGovLosses2, eloBoosts: newGovBoost2, topElo: newGovHighElo2, topEloLifetime: newGovHighEloLifetime2}});
						await mongoUsers.updateOne({id: findRound.oppDebater1}, {$set:{elo: newOppElo1, wins: newOppWins1,losses:newOppLosses1, eloBoosts: newOppBoost1, topElo: newOppHighElo1, topEloLifetime: newOppHighEloLifetime1}});		
						await mongoUsers.updateOne({id: findRound.oppDebater2}, {$set:{elo: newOppElo2, wins: newOppWins2,losses:newOppLosses2, eloBoosts: newOppBoost2, topElo: newOppHighElo2, topEloLifetime: newOppHighEloLifetime2}});		
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
			}else{
				
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
   var collector = interaction.channel.createMessageComponentCollector({ filter, time: 890000 });
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
				if(findRound.winner == results.govDebater){
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
         if(results.govBoost){
           var newGovBoost = govProfile.eloBoosts+1;
         }else{
           var newGovBoost = govProfile.eloBoosts; 
         }
         if(results.oppBoost){
           var newOppBoost = oppProfile.eloBoosts+1;
         }else{
           var newOppBoost = oppProfile.eloBoosts; 
         }
         if(results.govChangeHighElo){
			var newGovHighElo = results.govOriginalSeasonalElo;
		}else{
           var newGovHighElo = govProfile.topElo;
         }
         if(results.govChangeHighEloLifetime){
			var newGovHighEloLifetime = results.govOriginalLifetimeElo;
		}else{
           var newGovHighEloLifetime = govProfile.topEloLifetime;
         }
         if(results.oppChangeHighElo){
           var newOppHighElo = results.oppOriginalSeasonalElo;
         }else{
           var newOppHighElo = oppProfile.topElo;
         }
		 if(results.oppChangeHighEloLifetime){
			var newOppHighEloLifetime = results.oppOriginalLifetimeElo;
		}else{
           var newOppHighEloLifetime = oppProfile.topEloLifetime;
         }

				await mongoUsers.updateOne({id: findRound.govDebater}, {$set:{elo: newGovElo, wins: newGovWins,losses:newGovLosses, eloBoosts: newGovBoost, topElo: newGovHighElo, topEloLifetime: newGovHighEloLifetime}});
				await mongoUsers.updateOne({id: findRound.oppDebater}, {$set:{elo: newOppElo, wins: newOppWins,losses:newOppLosses, eloBoosts: newOppBoost, topElo: newOppHighElo, topEloLifetime: newOppHighEloLifetime}});		
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
			}
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
