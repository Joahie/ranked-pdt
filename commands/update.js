const { SlashCommandBuilder } = require('discord.js');
const {  ActionRowBuilder, ButtonBuilder, ButtonStyle, Events , EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const mongoRounds = mongoclient.db("RankedPDT").collection("rounds");

module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('update')
		.setDescription('Report a round that you debated in/judged to update elo')
		.addUserOption(option => option.setName('government-team').setDescription('Debater on the government team').setRequired(true))
		.addUserOption(option => option.setName('opposition-team').setDescription('Debater on the opposition team').setRequired(true))
		.addIntegerOption(option => option.setName('government-votes').setDescription('Number of judges who voted government').setRequired(true))
		.addIntegerOption(option => option.setName('opposition-votes').setDescription('Number of judges who voted opposition').setRequired(true))
		.addStringOption(option => option.setName('resolution').setDescription('The resolution that was debated').setRequired(true)),
	async execute(interaction) {
		if(interaction.channel.id != 1085212287603843185){
			return interaction.reply({ content: "Commands only work in <#1085212287603843185>", ephemeral: true });
		}
		var gov = interaction.options.getUser('government-team');
		var opp = interaction.options.getUser('opposition-team');
		var govVotes = interaction.options.getInteger('government-votes');
		var oppVotes = interaction.options.getInteger('opposition-votes');
		var resolution = interaction.options.getString('resolution');
		var totalVotes = govVotes + oppVotes;
		if(gov.id == opp.id){
			return interaction.reply({ content: "The government and opposition teams cannot be the same user", ephemeral: true });
		}
		if(gov.id == interaction.user){
			var otherDebaterID = opp.id;

		}else if(opp.id == interaction.user){
			var otherDebaterID = gov.id;
		}else{
			return interaction.reply({ content: "You can only report the results of a round if you were a participant/debater", ephemeral: true });
		}
		var govDB = await mongoUsers.findOne({id: gov.id})
		var oppDB = await mongoUsers.findOne({id: opp.id})
		if(gov.id == interaction.user){
			var otherDebaterName = oppDB.firstName + " " + oppDB.lastName ;

		}else if(opp.id == interaction.user){
			var otherDebaterName = govDB.firstName + " " + govDB.lastName ;
		}
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
		var row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('confirm')
					.setLabel('Confirm')
					.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()

					.setCustomId('cancel')
					.setLabel('Deny')
					.setStyle(ButtonStyle.Danger),
			);
			var greyOut = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('confirm')
					.setLabel('Confirm')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(true),
					new ButtonBuilder()

					.setCustomId('cancel')
					.setLabel('Deny')
					.setStyle(ButtonStyle.Danger)
					.setDisabled(true),
			);
		 await interaction.reply({embeds: [confirmationEmbed], components: [row]})
		 interaction.channel.send({content: "<@"+otherDebaterID+"> please confirm or deny the results of this round. If you don't respond within 1 day, the results will be automatically validated."})
		 var filter = i => {
			if(i.user.id == otherDebaterID) return true;
			else {
			  i.reply({content: "Only " + otherDebaterName + " can confirm or deny this round's results", ephemeral: true});
			  return false;
			}
		  }
		
		var collector = interaction.channel.createMessageComponentCollector({ filter, time: 86400000 });
		
		collector.on('collect', async i => {
				await i.update({components: [greyOut] });
				if(i.customId === 'confirm'){
					interaction.channel.send({content:"The results of round #"+roundID+" have been confirmed by <@"+otherDebaterID+">"})
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
					return interaction.channel.send({ embeds: [embed]});
					
				}else if(i.customId === "cancel"){
					return interaction.channel.send({content:"The results of the round reported by <@"+i.user.id+"> have been denied by <@"+otherDebaterID+">"})
				}
				console.log('HELLO')
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
		await interaction.channel.send({content: "<@"+otherDebaterID+"> didn't respond within 1 day, so round #" + roundID+" (reported by <@" +interaction.user.id+ ">) has been automatically validated."})
		return interaction.channel.send({ embeds: [embed]});
		

			}
		});
		
		
	
	},
};
