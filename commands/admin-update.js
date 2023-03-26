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
		var gov = interaction.options.getUser('government-team');
		var opp = interaction.options.getUser('opposition-team');
		var govVotes = interaction.options.getInteger('government-votes');
		var oppVotes = interaction.options.getInteger('opposition-votes');
		var resolution = interaction.options.getString('resolution');
		var totalVotes = govVotes + oppVotes;
		var userLookup = await mongoUsers.findOne({id: interaction.user.id})
		console.log(userLookup)
		var adminName = userLookup.firstName + " " + userLookup.lastName;
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
		oppVotes = oppVotes + ""
		govVotes = govVotes + ""
		var temp = await mongoRounds.findOne({id: "Count"});
		var amountOfRounds = temp.count*1
		var roundID = ("0000" + amountOfRounds).slice(-5);
		var newCount = amountOfRounds + 1
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
			var S_G = Math.pow(1.1, net_votes) - 0.1
			var S_O = net_votes * -0.05
			var winner = govDB.id;
			var winnerDeclaration = govFullName + " (<@" + gov.id+">)"
		}else{
			var S_O = Math.pow(1.1, net_votes) - 0.1
			var S_G = net_votes * 0.05
			var winner = oppDB.id;
			var winnerDeclaration = oppFullName + " (<@" + opp.id+">)"
		}
		R_G = R_G + 80 * (S_G - E_G) 
		R_O = R_O + 80 * (S_O - E_O)

		var govEloChange =R_G- govDB.elo*1
		var oppEloChange = R_O - oppDB.elo*1
		var originalGovElo = govDB.elo;
		var originalOppElo = oppDB.elo;

		
		var govTeamConfirmationEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes;
		var oppTeamConfirmationEmbed = "Debater: " + oppFullName + "(<@"+opp.id+">)\nVotes: " + oppVotes;
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
		 interaction.channel.send({content: "Please confirm that these results are accurate."})
		 var filter = i => {
			if(i.customId != confirmId && i.customId != cancelId){
				return false;
			}
			if(i.user.id == interaction.user.id) return true;
			else {
			  i.reply({content: "Only " + adminName + " can confirm or deny this round's results", ephemeral: true});
			  return false;
			}
		  }
		
		var collector = interaction.channel.createMessageComponentCollector({ filter, time: 900000 });
		
		collector.on('collect', async i => {
				await i.update({components: [greyOut] });
				if(i.customId === confirmId){
					await interaction.followUp({content:"The results of round #"+roundID+" have been confirmed."})
					await mongoRounds.insertOne({id: amountOfRounds, displayID: roundID, govDebater: gov.id, oppDebater: opp.id, govVotes: govVotes, oppVotes: oppVotes, resolution: resolution, date: dateFormatted, govElo: R_G,oppElo: R_O,govEloChange: govEloChange, oppEloChange: oppEloChange, winner: winner})
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
					await mongoUsers.updateOne({id: govDB.id},{$set:{elo: R_G, wins: newGovWins, losses: newGovLosses}})
					await mongoUsers.updateOne({id: oppDB.id},{$set:{elo: R_O, wins: newOppWins, losses: newOppLosses}})
					if(govEloChange > 0){
						var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: +"+Math.floor(govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(R_G)+"]";
					}else{
						var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: "+Math.floor(govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(R_G)+"]";
					}
					if(oppEloChange > 0){
						var oppTeamEmbed = "Debater: " + oppFullName + "(<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: +"+Math.floor(oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(R_O)+"]";
					}else{
						var oppTeamEmbed = "Debater: " + oppFullName + "(<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: "+Math.floor(oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(R_O)+"]";
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
					return interaction.followUp({content:"The round reported by <@" + interaction.user.id + "> has been cancelled."})
				}
		});
		
		collector.on('end', async collected => {

			if(collected.size == 0){
				await interaction.editReply({components: [greyOut] });

		await mongoRounds.insertOne({id: amountOfRounds, displayID: roundID, govDebater: gov.id, oppDebater: opp.id, govVotes: govVotes, oppVotes: oppVotes, resolution: resolution, date: dateFormatted, govElo: R_G,oppElo: R_O,govEloChange: govEloChange, oppEloChange: oppEloChange, winner: winner})
		await mongoRounds.updateOne({id: "Count"},{$set:{count: newCount}})
		if(gov_votes > opp_votes){
			var newGovWins = govDB.wins*1 + 1
			var newOppWins = oppDB.wins*1 - 1
		}else{
			var newGovWins = govDB.wins*1 - 1
			var newOppWins = oppDB.wins*1 + 1
		}
		await mongoUsers.updateOne({id: govDB.id},{$set:{elo: R_G, wins: newGovWins}})
		await mongoUsers.updateOne({id: oppDB.id},{$set:{elo: R_O, wins: newOppWins}})
		if(govEloChange > 0){
			var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: +"+Math.floor(govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(R_G)+"]";
		}else{
			var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: "+Math.floor(govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(R_G)+"]";
		}
		if(oppEloChange > 0){
			var oppTeamEmbed = "Debater: " + oppFullName + "(<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: +"+Math.floor(oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(R_O)+"]";
		}else{
			var oppTeamEmbed = "Debater: " + oppFullName + "(<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: "+Math.floor(oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(R_O)+"]";
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
		await interaction.channel.send({content: "<@"+interaction.user.id+"> didn't respond within 15 minutes, so round #" + roundID+" has been automatically validated."})
		return interaction.channel.send({ embeds: [embed]});
		

			}
		});
		
		
	
	},
};
