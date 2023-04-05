const { SlashCommandBuilder } = require('discord.js');
const {  ActionRowBuilder, ButtonBuilder, ButtonStyle, Events , EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const mongoRounds = mongoclient.db("RankedPDT").collection("rounds");
const crypto = require('crypto');
module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('admin-update')
		.setDescription('Admin override for reporting a round (no opponent confirmation needed)')
		.addUserOption(option => option.setName('government-team').setDescription('Debater on the government team').setRequired(true))
		.addUserOption(option => option.setName('opposition-team').setDescription('Debater on the opposition team').setRequired(true))
		.addIntegerOption(option => option.setName('government-votes').setDescription('Number of judges who voted government').setRequired(true))
		.addIntegerOption(option => option.setName('opposition-votes').setDescription('Number of judges who voted opposition').setRequired(true))
		.addStringOption(option => option.setName('resolution').setDescription('The resolution that was debated').setRequired(true)),
	async execute(interaction) {
		try{
			var gov = interaction.options.getUser('government-team');
			var opp = interaction.options.getUser('opposition-team');
			var govVotes = interaction.options.getInteger('government-votes');
			var oppVotes = interaction.options.getInteger('opposition-votes');
			var resolution = interaction.options.getString('resolution');
			var totalVotes = govVotes + oppVotes;
			if(gov.id == opp.id){
				return interaction.reply({ content: "The government and opposition teams cannot be the same user", ephemeral: true });
			}
			var govDB = await mongoUsers.findOne({id: gov.id})
			var oppDB = await mongoUsers.findOne({id: opp.id})
	
			if(govDB == null && oppDB == null){
				return interaction.reply({ content: gov.username  + " and " + opp.username + " don't have Ranked PDT accounts", ephemeral: true });
			}
			if(govDB == null){
				return interaction.reply({ content: gov.username + " doesn't have a Ranked PDT account", ephemeral: true });
			}
			if(oppDB == null){
				return interaction.reply({ content: opp.username + " doesn't have a Ranked PDT account", ephemeral: true });
			}
			if(govVotes < 0 || oppVotes < 0){
				return interaction.reply({ content: "You can't have a negative number of votes for a team", ephemeral: true });
			}
			if((totalVotes % 2) != 1){
				return interaction.reply({ content: "The total number of judges needs to be odd", ephemeral: true });
			}
			if(totalVotes > 5){
				return interaction.reply({ content: "You can't have more than 5 judges for a round", ephemeral: true });
			}
			oppVotes = oppVotes + ""
			govVotes = govVotes + ""
			var govFullName = govDB.firstName + " " + govDB.lastName;
			var oppFullName = oppDB.firstName + " " + oppDB.lastName;
			const d = new Date();
			const month = d.getMonth() + 1
			const dateFormatted = month + "/" + d.getDate() + "/" + d.getFullYear();
	
			var gov_votes = govVotes;
			var opp_votes = oppVotes;
			var R_G = govDB.elo*1
			var R_O = oppDB.elo*1
			var E_G = 1/(1+ (Math.pow(10,((R_O - R_G)/400))))
			var E_O = 1/(1+ (Math.pow(10,((R_G - R_O)/400))))
			var net_votes = gov_votes - opp_votes
			if (net_votes > 0){
				var govWon = true;
				var S_G = Math.pow(1.1, net_votes) - 0.1
				var S_O = net_votes * -0.05
				var winner = govDB.id;
				var winnerDeclaration = govFullName + " (<@" + gov.id+">)"
			}else{
				var S_O = Math.pow(1.1, -net_votes) - 0.1
				var S_G = net_votes * 0.05
				var winner = oppDB.id;
				var winnerDeclaration = oppFullName + " (<@" + opp.id+">)"
			}
			if(govDB.eloBoosts > 0){
				govBoostBoolean = true;
				if(govWon){
					R_G = R_G + 1.2 * 80 * (S_G - E_G) 
				}else{
					R_G = R_G + 80 * (S_G - E_G) 
				}
				let remaining = govDB.eloBoosts - 1
				var govEloBoost = "\n" +govFullName  + " used an elo boost. They have " + remaining + " remaining."
			}else{
				govBoostBoolean = false;
				R_G = R_G + 80 * (S_G - E_G)
				var govEloBoost = ""
			}
			if(oppDB.eloBoosts > 0){
				oppBoostBoolean = true;
				if(!govWon){
					R_O = R_O + 1.2 * 80 * (S_O - E_O) 
				}else{
					R_O = R_O + 80 * (S_O - E_O) 
				}			let remaining = oppDB.eloBoosts - 1
				var oppEloBoost = "\n" + oppFullName  + " used an elo boost. They have " + remaining + " remaining."
			}else{
				oppBoostBoolean = false;
				R_O = R_O + 80 * (S_O - E_O)
				var oppEloBoost = ""
			}
			if(R_G < 0){
				R_G = 0;
			}
			if(R_O < 0){
				R_O = 0;
			}
			var govEloChange =R_G- govDB.elo*1
			var oppEloChange = R_O - oppDB.elo*1
			var originalGovElo = govDB.elo;
			var originalOppElo = oppDB.elo;
			var govTeamConfirmationEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes;
			var oppTeamConfirmationEmbed = "Debater: " + oppFullName + " (<@"+opp.id+">)\nVotes: " + oppVotes;
			const confirmationEmbed = new EmbedBuilder()
	
			.setColor(0x0099FF)
			.setTitle("Round Confirmation")
			.setDescription('Resolution: ' + resolution)
			.addFields(
				{ name: 'Government Team', value: govTeamConfirmationEmbed, inline: false},
				{ name: 'Opposition Team', value: oppTeamConfirmationEmbed, inline: false},
				{ name: 'Winner', value: winnerDeclaration, inline: false},
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
			 var filter = i => {
				if(i.customId != confirmId && i.customId != cancelId){
					return false;
				}
				if(i.user.id == interaction.user.id) return true;
				else {
				  i.reply({content: "Only " + interaction.user.username + " can confirm or deny this round's results", ephemeral: true});
				  return false;
				}
			  }
			
			var collector = interaction.channel.createMessageComponentCollector({ filter, time: 890000 });
			
			collector.on('collect', async i => {
					await i.update({components: [greyOut] });
					var temp = await mongoRounds.findOne({id: "Count"});
					var amountOfRounds = temp.count*1
					var roundID = ("0000" + amountOfRounds).slice(-5);
					var newCount = amountOfRounds + 1
					if(i.customId === confirmId){
						await interaction.followUp({content:"The results of round #"+roundID+" have been confirmed"})
						if(R_G > govDB.topElo){
							var govHighElo = "\n" + govFullName + " has a new highest elo [" +Math.floor(govDB.topElo) + " ➜ "+Math.floor(R_G)+"]"
							await mongoUsers.updateOne({id: govDB.id},{$set:{topElo: R_G}} )
							var govChangeHighElo = true;
						}else{
							var govHighElo = ""
							var govChangeHighElo = false;
	
						}
						if(R_O > oppDB.topElo){
							var oppHighElo = "\n" + oppFullName + " has a new highest elo [" +Math.floor(oppDB.topElo) + " ➜ "+Math.floor(R_O)+"]"
							await mongoUsers.updateOne({id: oppDB.id},{$set:{topElo: R_O}} )
							var oppChangeHighElo = true;
	
						}else{
							var oppHighElo = ""
							var oppChangeHighElo = false;
						}
						await mongoRounds.insertOne({id: amountOfRounds, displayID: roundID, govDebater: gov.id, oppDebater: opp.id, govVotes: govVotes, oppVotes: oppVotes, resolution: resolution, date: dateFormatted, govElo: R_G,oppElo: R_O,govEloChange: govEloChange, oppEloChange: oppEloChange, winner: winner, govBoost: govBoostBoolean, oppBoost: oppBoostBoolean , govChangeHighElo: govChangeHighElo, oppChangeHighElo:oppChangeHighElo })
	
						await mongoRounds.updateOne({id: "Count"},{$set:{count: newCount}})
						if(gov_votes > opp_votes){
							var newGovWins = govDB.wins*1 + 1
							var newOppWins = oppDB.wins*1
							var newGovLosses = govDB.losses*1
							var newOppLosses = oppDB.losses*1+1
						}else{
							var newGovWins = govDB.wins*1
							var newOppWins = oppDB.wins*1 + 1
							var newGovLosses = govDB.losses*1+1
							var newOppLosses = oppDB.losses*1
						}
	if(govDB.eloBoosts > 0){
		var newGovEloBoosts = govDB.eloBoosts - 1;
	}else{
		var newGovEloBoosts = 0
	}
	if(oppDB.eloBoosts > 0){
		var newOppEloBoosts = oppDB.eloBoosts - 1;
	}else{
		var newOppEloBoosts = 0
	}
			
						await mongoUsers.updateOne({id: govDB.id},{$set:{elo: R_G, wins: newGovWins, losses: newGovLosses, eloBoosts: newGovEloBoosts}})
						await mongoUsers.updateOne({id: oppDB.id},{$set:{elo: R_O, wins: newOppWins, losses: newOppLosses, eloBoosts: newOppEloBoosts}})
						if(govEloChange > 0){
							var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: +"+Math.floor(govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(R_G)+"]" + govEloBoost + govHighElo;
						}else{
							var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: "+Math.floor(govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(R_G)+"]"+ govEloBoost + govHighElo;
						}
						if(oppEloChange > 0){
							var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: +"+Math.floor(oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(R_O)+"]"+oppEloBoost + oppHighElo;
						}else{
							var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: "+Math.floor(oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(R_O)+"]"+oppEloBoost + oppHighElo;
						}
						const embed = new EmbedBuilder()
				
					.setColor(0x0099FF)
					.setTitle("Round #" + roundID)
					.setDescription('Resolution: ' + resolution)
					.addFields(
						{ name: 'Government Team', value: govTeamEmbed, inline: false},
						{ name: 'Opposition Team', value: oppTeamEmbed, inline: false},
						{ name: 'Winner', value: winnerDeclaration, inline: false},
					)
						return interaction.channel.send({ embeds: [embed]});
						
					}else if(i.customId === cancelId){
						return interaction.followUp({content:"The results of the round reported by <@"+interaction.user.id+"> have been cancelled"})
					}
			});
			
			collector.on('end', async collected => {
	
				if(collected.size == 0){
					await i.update({components: [greyOut] });
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
