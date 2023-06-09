const { SlashCommandBuilder } = require('discord.js');
const {  ActionRowBuilder, ButtonBuilder, ButtonStyle, Events , EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const mongoRounds = mongoclient.db("RankedPDT").collection("rounds");
const crypto = require('crypto');
module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('update')
		.setDescription('Report a round that you debated in to update elo')
		.addUserOption(option => option.setName('government-team-one').setDescription('First debater on the government team').setRequired(true))
		.addUserOption(option => option.setName('opposition-team-one').setDescription('First debater on the opposition team').setRequired(true))
		.addIntegerOption(option => option.setName('government-votes').setDescription('Number of judges who voted government').setRequired(true))
		.addIntegerOption(option => option.setName('opposition-votes').setDescription('Number of judges who voted opposition').setRequired(true))
		.addStringOption(option => option.setName('resolution').setDescription('The resolution that was debated').setRequired(true))
		
		.addUserOption(option => option.setName('government-team-two').setDescription('Second debater on the government team').setRequired(false))
		.addUserOption(option => option.setName('opposition-team-two').setDescription('Second debater on the opposition team').setRequired(false)),
	async execute(interaction) {
		try{
			/*
			function compareDate() {
				var limitDate = new Date(2023, 04, 1, 7, 0);
				var currentDate = new Date();
				console.log(currentDate)
				if (currentDate > limitDate) {
					 return true;
				 }else{
					return false;
				 }
			 }
			 if(compareDate()){
				return interaction.reply({ content: "Ranked PDT season 1 has ended, so you can't upload round results anymore", ephemeral: true });
			}*/

		var gov = interaction.options.getUser('government-team-one');
		var opp = interaction.options.getUser('opposition-team-one');
		var govVotes = interaction.options.getInteger('government-votes');
		var oppVotes = interaction.options.getInteger('opposition-votes');
		var resolution = interaction.options.getString('resolution');
		var gov2 = interaction.options.getUser('government-team-two');
		var opp2 = interaction.options.getUser('opposition-team-two');
		if(gov2 == null && opp2 == null){
			var singles = true;
		}else if (gov2==null){
			return interaction.reply({ content: "You need a second government speaker. You cannot only have 3 debaters", ephemeral: true });
		}else if (opp2==null){
			return interaction.reply({ content: "You need a second opposition speaker. You cannot only have 3 debaters", ephemeral: true });
		}
		if(!singles){
			var gov1 = gov;
			var opp1 = opp;
			if(gov1.id == gov2.id || gov1.id == opp2.id || opp1.id == gov2.id || opp1.id == opp2.id || gov1.id == opp1.id){
				return interaction.reply({ content: "You need 4 unique debaters. They can't be the same person.", ephemeral: true });
			}
			var totalVotes = govVotes + oppVotes;
			if(gov1.id == interaction.user || gov2.id == interaction.user){
				var otherDebaterID1 = opp1.id;
				var otherDebaterID2 = opp2.id;
			}else if(opp1.id == interaction.user || opp2.id == interaction.user){
				var otherDebaterID1 = gov1.id;
				var otherDebaterID2 = gov2.id;			
			}else{
				return interaction.reply({ content: "You can only report the results of a round if you were a participant/debater", ephemeral: true });
			}
			var govDB1 = await mongoUsers.findOne({id: gov1.id})
			var oppDB1 = await mongoUsers.findOne({id: opp1.id})
			var govDB2 = await mongoUsers.findOne({id: gov2.id})
			var oppDB2 = await mongoUsers.findOne({id: opp2.id})
			if(govDB1 == null){
				return interaction.reply({ content: gov1.username + " doesn't have a Ranked PDT account", ephemeral: true });
			}
			if(oppDB1 == null){
				return interaction.reply({ content: opp1.username + " doesn't have a Ranked PDT account", ephemeral: true });
			}
			if(govDB2 == null){
				return interaction.reply({ content: gov2.username + " doesn't have a Ranked PDT account", ephemeral: true });
			}
			if(oppDB2 == null){
				return interaction.reply({ content: opp2.username + " doesn't have a Ranked PDT account", ephemeral: true });
			}
			if(govDB1.deleted || oppDB1.deleted || oppDB2.deleted || govDB2.deleted){
				return interaction.reply({ content: "At least one of these user's accounts has been deleted", ephemeral: true });
			}
			if(gov1.id == interaction.user || gov2.id == interaction.user){
				var otherDebaterName1 = oppDB1.firstName + " " + oppDB1.lastName;
				var otherDebaterName2 = oppDB2.firstName + " " + oppDB2.lastName;
			}else if(opp1.id == interaction.user || opp2.id == interaction.user){
				var otherDebaterName1 = govDB1.firstName + " " + govDB1.lastName;
				var otherDebaterName2 = govDB2.firstName + " " + govDB2.lastName;		
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
			
			var govFullName1 = govDB1.firstName + " " + govDB1.lastName;
			var oppFullName1 = oppDB1.firstName + " " + oppDB1.lastName;
			var govFullName2 = govDB2.firstName + " " + govDB2.lastName;
			var oppFullName2 = oppDB2.firstName + " " + oppDB2.lastName;
			const d = new Date();
			const month = d.getMonth() + 1
			const dateFormatted = month + "/" + d.getDate() + "/" + d.getFullYear();
			var gov_votes = govVotes;
			var opp_votes = oppVotes;
			var R_G1 = govDB1.elo
			var R_G2 = govDB2.elo
			var R_O1 = oppDB1.elo
			var R_O2 = oppDB2.elo
			var R_G = (R_G1+R_G2)/2
			var R_O = (R_O1+R_O2)/2
			var E_G1 = 1/(1+ (Math.pow(10,((R_O - R_G1)/400))))
			var E_G2 = 1/(1+ (Math.pow(10,((R_O - R_G2)/400))))
			var E_O1 = 1/(1+ (Math.pow(10,((R_G - R_O1)/400))))
			var E_O2 = 1/(1+ (Math.pow(10,((R_G - R_O2)/400))))
			var net_votes = gov_votes - opp_votes
			if (net_votes > 0){
				var govWon = true;
				var S_G = Math.pow(1.1, net_votes) - 0.1
				var S_O = net_votes * -0.05
				var winner1 = govDB1.id;
				var winner2 = govDB2.id;
				let sortArray = [govDB1.lastName, govDB2.lastName]
				sortArray.sort()
				var winnerDeclaration = sortArray[0] + "/" +  sortArray[1]
			}else{
				var S_O = Math.pow(1.1, -net_votes) - 0.1
				var S_G = net_votes * 0.05
				var winner1 = oppDB1.id;
				var winner2 = oppDB2.id;
				let sortArray = [oppDB1.lastName, oppDB2.lastName]
				sortArray.sort()
				var winnerDeclaration = sortArray[0] + "/" +  sortArray[1]			}
				var govBoost1 = false;
				var govBoost2 = false;
			if(govDB1.eloBoosts > govDB2.eloBoosts){
				var govEloBooster = govDB1;
				var govBoosterFullName = govFullName1;
				var doGovBoosts = true;
				var govEloBoostsRemaining1 = govDB1.eloBoosts*1-1;
				var govEloBoostsRemaining2 = govDB2.eloBoosts;
				govBoost1 = true
			}else if(govDB1.eloBoosts < govDB2.eloBoosts){
				var govEloBooster = govDB2;
				var govBoosterFullName = govFullName2;
				var doGovBoosts = true;
				var govEloBoostsRemaining1 = govDB1.eloBoosts;
				var govEloBoostsRemaining2 = govDB2.eloBoosts*1-1;
				govBoost2 = true
			}else if(govDB1.eloBoosts == 0){
				var doGovBoosts = false;
				var govEloBoostsRemaining1 = govDB1.eloBoosts;
				var govEloBoostsRemaining2 = govDB2.eloBoosts;
			}else{
				var doGovBoosts = true;
				if(Math.random()<0.5){
					var govEloBooster = govDB2;
					var govBoosterFullName = govFullName2;
					var govEloBoostsRemaining1 = govDB1.eloBoosts;
					var govEloBoostsRemaining2 = govDB2.eloBoosts*1-1;
					govBoost2 = true
				}else{
					var govEloBooster = govDB1;
					var govBoosterFullName = govFullName1;
					var govEloBoostsRemaining1 = govDB1.eloBoosts*1-1;
					var govEloBoostsRemaining2 = govDB2.eloBoosts;
					govBoost1 = true
				}
			}
			var oppBoost1 = false;
			var oppBoost2 = false;
			if(oppDB1.eloBoosts > oppDB2.eloBoosts){
				var oppEloBooster = oppDB1;
				var oppBoosterFullName = oppFullName1;
				var dooppBoosts = true;
				var oppEloBoostsRemaining1 = oppDB1.eloBoosts*1-1;
				var oppEloBoostsRemaining2 = oppDB2.eloBoosts;
				oppBoost1 = true;
			}else if(oppDB1.eloBoosts < oppDB2.eloBoosts){
				var oppEloBooster = oppDB2;
				var oppBoosterFullName = oppFullName2;
				var dooppBoosts = true;
				var oppEloBoostsRemaining1 = oppDB1.eloBoosts;
				var oppEloBoostsRemaining2 = oppDB2.eloBoosts*1-1;
				oppBoost2 = true;
			}else if(oppDB1.eloBoosts == 0){
				var dooppBoosts = false;
				var oppEloBoostsRemaining1 = oppDB1.eloBoosts;
				var oppEloBoostsRemaining2 = oppDB2.eloBoosts;
			}else{
				var dooppBoosts = true;
				if(Math.random()<0.5){
					var oppEloBooster = oppDB2;
					var oppBoosterFullName = oppFullName2;
					var oppEloBoostsRemaining1 = oppDB1.eloBoosts;
					var oppEloBoostsRemaining2 = oppDB2.eloBoosts*1-1;
					oppBoost2 = true;
				}else{
					var oppEloBooster = oppDB1;
					var oppBoosterFullName = oppFullName1;
					var oppEloBoostsRemaining1 = oppDB1.eloBoosts*1-1;
					var oppEloBoostsRemaining2 = oppDB2.eloBoosts;
					oppBoost1 = true;
				}
			}
			if(doGovBoosts){
				govBoostBoolean = true;
				if(govWon){
					R_G1 = R_G1 + 1.2 * 80 * (S_G - E_G1)
					R_G2 = R_G2 + 1.2 * 80 * (S_G - E_G2)
				}else{
					R_G1 = R_G1 + 80 * (S_G - E_G1)
					R_G2 = R_G2 + 80 * (S_G - E_G2)
				}
				let remaining = govEloBooster.eloBoosts - 1
				var govEloBoost = "\n" +govBoosterFullName  + " used an elo boost. They have " + remaining + " remaining."
			}else{
				govBoostBoolean = false;
				R_G1 = R_G1 + 80 * (S_G - E_G1)
				R_G2 = R_G2 + 80 * (S_G - E_G2)
				var govEloBoost = ""
			}

if(dooppBoosts){
    oppBoostBoolean = true;
    if(oppWon){
        R_O1 = R_O1 + 1.2 * 80 * (S_O - E_O1)
        R_O2 = R_O2 + 1.2 * 80 * (S_O - E_O2)
    }else{
        R_O1 = R_O1 + 80 * (S_O - E_O1)
        R_O2 = R_O2 + 80 * (S_O - E_O2)
    }
    let remaining = oppEloBooster.eloBoosts - 1
    var oppEloBoost = "\n" +oppBoosterFullName  + " used an elo boost. They have " + remaining + " remaining."
}else{
    oppBoostBoolean = false;
    R_O1 = R_O1 + 80 * (S_O - E_O1)
    R_O2 = R_O2 + 80 * (S_O - E_O2)
    var oppEloBoost = ""
}
			if(R_G1 < 0){
				R_G1 = 0;
			}
			if(R_O1 < 0){
				R_O1 = 0;
			}
			if(R_G2 < 0){
				R_G2 = 0;
			}
			if(R_O2 < 0){
				R_O2 = 0;
			}
			var govEloChange1 =R_G1 - govDB1.elo*1
			var govEloChange2 =R_G2 - govDB2.elo*1
			var oppEloChange1 =R_O1 - oppDB1.elo*1
			var oppEloChange2 =R_O2 - oppDB2.elo*1
			var originalGovElo1 = govDB1.elo;
			var originalGovElo2 = govDB2.elo;
			var originalOppElo1 = oppDB1.elo;
			var originalOppElo2 = oppDB2.elo;
			let govSortArray = [govDB1.lastName, govDB2.lastName]
			govSortArray.sort()
			var govTeamName = govSortArray[0] + "/" +  govSortArray[1]
			if(govSortArray[0] == govDB1.lastName){
				var govTeamNamePing = "<@"+govDB1.id+">/<@"+govDB2.id+">"
				var govFirstSpeaker = govDB1.firstName + " " + govDB1.lastName
				var govSecondSpeaker = govDB2.firstName + " " + govDB2.lastName
				var govChange = false;
			}else{
				var govTeamNamePing = "<@"+govDB2.id+">/<@"+govDB1.id+">"
				var govSecondSpeaker = govDB1.firstName + " " + govDB1.lastName
				var govFirstSpeaker = govDB2.firstName + " " + govDB2.lastName
				var govChange = true;
			}
			let oppSortArray = [oppDB1.lastName, oppDB2.lastName]
			oppSortArray.sort()
			var oppTeamName = oppSortArray[0] + "/" +  oppSortArray[1]
			if(oppSortArray[0] == oppDB1.lastName){
				var oppTeamNamePing = "<@"+oppDB1.id+">/<@"+oppDB2.id+">"
				var oppFirstSpeaker = oppDB1.firstName + " " + oppDB1.lastName
				var oppSecondSpeaker = oppDB2.firstName + " " + oppDB2.lastName
				var oppChange = false;
			}else{
				var oppTeamNamePing = "<@"+oppDB2.id+">/<@"+oppDB1.id+">"
				var oppSecondSpeaker = oppDB1.firstName + " " + oppDB1.lastName
				var oppFirstSpeaker = oppDB2.firstName + " " + oppDB2.lastName
				var oppChange = true;
			}
			var govTeamConfirmationEmbed = "Team: " + govTeamName + " ("+govTeamNamePing+")\nVotes: " + govVotes;
			var oppTeamConfirmationEmbed = "Team: " + oppTeamName + " ("+oppTeamNamePing+")\nVotes: " + oppVotes;
			const confirmationEmbed = new EmbedBuilder()
	
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

			 interaction.channel.send({content: "<@"+otherDebaterID1+"> <@"+otherDebaterID2+"> please confirm or deny the results of this round. If you don't respond within 15 minutes, the results will be automatically validated."})
			 var filter = i => {
				if(i.customId != confirmId && i.customId != cancelId){
					return false;
				}
				if(i.user.id == otherDebaterID1 || i.user.id == otherDebaterID2) return true;
				else {
				  i.reply({content: "Only " + otherDebaterName1 + " or "+ otherDebaterName2 + " can confirm or deny this round's results", ephemeral: true});
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
					await interaction.followUp({content:"The results of round #"+roundID+" have been confirmed by <@"+i.user.id+">"})
					if(R_G1 > govDB1.topElo){
						var govHighElo1 = "\n" + govFullName1 + " has a new highest seasonal elo [" +Math.floor(govDB1.topElo) + " ➜ "+Math.floor(R_G1)+"]"
						await mongoUsers.updateOne({id: govDB1.id},{$set:{topElo: R_G1}} )
						var govChangeHighElo1 = true;
					}else{
						var govHighElo1 = ""
						var govChangeHighElo1 = false;
					}
					if(R_G2 > govDB2.topElo){
						var govHighElo2 = "\n" + govFullName2 + " has a new highest seasonal elo [" +Math.floor(govDB2.topElo) + " ➜ "+Math.floor(R_G2)+"]"
						await mongoUsers.updateOne({id: govDB2.id},{$set:{topElo: R_G2}} )
						var govChangeHighElo2 = true;
					}else{
						var govHighElo2 = ""
						var govChangeHighElo2 = false;
					}
					if(R_G1 > govDB1.topEloLifetime){
						var govHighEloLifetime1 = "\n" + govFullName1 + " has a new highest lifetime elo [" +Math.floor(govDB1.topEloLifetime) + " ➜ "+Math.floor(R_G1)+"]"
						await mongoUsers.updateOne({id: govDB1.id},{$set:{topEloLifetime: R_G1}} )
						var govChangeHighEloLifetime1 = true;
					}else{
						var govHighEloLifetime1 = ""
						var govChangeHighEloLifetime1 = false;
					}
					if(R_G2 > govDB2.topEloLifetime){
						var govHighEloLifetime2 = "\n" + govFullName2 + " has a new highest lifetime elo [" +Math.floor(govDB2.topEloLifetime) + " ➜ "+Math.floor(R_G2)+"]"
						await mongoUsers.updateOne({id: govDB2.id},{$set:{topEloLifetime: R_G2}} )
						var govChangeHighEloLifetime2 = true;
					}else{
						var govHighEloLifetime2 = ""
						var govChangeHighEloLifetime2 = false;
					}
					
					if(R_O1 > oppDB1.topElo){
						var oppHighElo1 = "\n" + oppFullName1 + " has a new highest seasonal elo [" +Math.floor(oppDB1.topElo) + " ➜ "+Math.floor(R_O1)+"]"
						await mongoUsers.updateOne({id: oppDB1.id},{$set:{topElo: R_O1}} )
						var oppChangeHighElo1 = true;
					}else{
						var oppHighElo1 = ""
						var oppChangeHighElo1 = false;
					}
					if(R_O2 > oppDB2.topElo){
						var oppHighElo2 = "\n" + oppFullName2 + " has a new highest seasonal elo [" +Math.floor(oppDB2.topElo) + " ➜ "+Math.floor(R_O2)+"]"
						await mongoUsers.updateOne({id: oppDB2.id},{$set:{topElo: R_O2}} )
						var oppChangeHighElo2 = true;
					}else{
						var oppHighElo2 = ""
						var oppChangeHighElo2 = false;
					}
					if(R_O1 > oppDB1.topEloLifetime){
						var oppHighEloLifetime1 = "\n" + oppFullName1 + " has a new highest lifetime elo [" +Math.floor(oppDB1.topEloLifetime) + " ➜ "+Math.floor(R_O1)+"]"
						await mongoUsers.updateOne({id: oppDB1.id},{$set:{topEloLifetime: R_O1}} )
						var oppChangeHighEloLifetime1 = true;
					}else{
						var oppHighEloLifetime1 = ""
						var oppChangeHighEloLifetime1 = false;
					}
					if(R_O2 > oppDB2.topEloLifetime){
						var oppHighEloLifetime2 = "\n" + oppFullName2 + " has a new highest lifetime elo [" +Math.floor(oppDB2.topEloLifetime) + " ➜ "+Math.floor(R_O2)+"]"
						await mongoUsers.updateOne({id: oppDB2.id},{$set:{topEloLifetime: R_O2}} )
						var oppChangeHighEloLifetime2 = true;
					}else{
						var oppHighEloLifetime2 = ""
						var oppChangeHighEloLifetime2 = false;
					}
					await mongoRounds.insertOne({id: amountOfRounds, displayID: roundID, govDebater1: govDB1.id,govDebater2: govDB2.id, oppDebater1: oppDB1.id,oppDebater2: oppDB2.id, govVotes: govVotes, oppVotes: oppVotes, resolution: resolution, date: dateFormatted, govElo1: R_G1,govElo2: R_G2,oppElo1: R_O1,oppElo2: R_O2,govEloChange1: govEloChange1, govEloChange2: govEloChange2, oppEloChange1: oppEloChange1,oppEloChange2: oppEloChange2, winner1: winner1, winner2: winner2, govBoost: govBoostBoolean,govBoosterName: govBoosterFullName, oppBoost: oppBoostBoolean,oppBoosterName: oppBoosterFullName, govChangeHighElo1: govChangeHighElo1, govChangeHighElo2: govChangeHighElo2, oppChangeHighElo1:oppChangeHighElo1,oppChangeHighElo2:oppChangeHighElo2, govChangeHighEloLifetime1: govChangeHighEloLifetime1,  govChangeHighEloLifetime2: govChangeHighEloLifetime2, oppChangeHighEloLifetime1:oppChangeHighEloLifetime1,  oppChangeHighEloLifetime2:oppChangeHighEloLifetime2, govBoost1: govBoost1,  govBoost2: govBoost2, oppBoost1: oppBoost1, oppBoost2: oppBoost2, govOriginalSeasonalElo1: govDB1.topElo,govOriginalLifetimeElo1: govDB1.topEloLifetime, oppOriginalSeasonalElo1: oppDB1.topElo,oppOriginalLifetimeElo1: oppDB1.topEloLifetime, govOriginalSeasonalElo2: govDB2.topElo,govOriginalLifetimeElo2: govDB2.topEloLifetime, oppOriginalSeasonalElo2: oppDB2.topElo,oppOriginalLifetimeElo2: oppDB2.topEloLifetime})
					await mongoRounds.updateOne({id: "Count"},{$set:{count: newCount}})
					if(gov_votes > opp_votes){
						var newGovWins1 = govDB1.wins*1 + 1
						var newOppWins1 = oppDB1.wins*1
						var newGovLosses1 = govDB1.losses*1
						var newOppLosses1 = oppDB1.losses*1+1
						var newGovWins2 = govDB2.wins*1 + 1
						var newOppWins2 = oppDB2.wins*1
						var newGovLosses2 = govDB2.losses*1
						var newOppLosses2 = oppDB2.losses*1+1
					}else{
						var newGovWins1 = govDB1.wins*1
						var newOppWins1 = oppDB1.wins*1 + 1
						var newGovLosses1 = govDB1.losses*1+1
						var newOppLosses1 = oppDB1.losses*1
						var newGovWins2 = govDB2.wins*1
						var newOppWins2 = oppDB2.wins*1 + 1
						var newGovLosses2 = govDB2.losses*1+1
						var newOppLosses2 = oppDB2.losses*1
					}
					await mongoUsers.updateOne({id: govDB1.id},{$set:{elo: R_G1, wins: newGovWins1, losses: newGovLosses1, eloBoosts: govEloBoostsRemaining1}})
					await mongoUsers.updateOne({id: govDB2.id},{$set:{elo: R_G2, wins: newGovWins2, losses: newGovLosses2, eloBoosts: govEloBoostsRemaining2}})
					await mongoUsers.updateOne({id: oppDB1.id},{$set:{elo: R_O1, wins: newOppWins1, losses: newOppLosses1, eloBoosts: oppEloBoostsRemaining1}})
					await mongoUsers.updateOne({id: oppDB2.id},{$set:{elo: R_O2, wins: newOppWins2, losses: newOppLosses2, eloBoosts: oppEloBoostsRemaining2}})
					if(govEloChange > 0){
						var govTeamEmbed = "Team: " + govTeamName + " ("+govTeamNamePing+")\nVotes: " + govVotes + govEloBoost
						var govDebaterEmbed1 = "Elo: +"+Math.floor(govEloChange1) + " ["+Math.floor(originalGovElo1)+" ➜ " +Math.floor(R_G1)+"]" + govHighElo1 + govHighEloLifetime1
						var govDebaterEmbed2 = "Elo: +"+Math.floor(govEloChange2) + " ["+Math.floor(originalGovElo2)+" ➜ " +Math.floor(R_G2)+"]" + govHighElo2 + govHighEloLifetime2 ;
					}else{
						var govTeamEmbed = "Team: " + govTeamName + " ("+govTeamNamePing+")\nVotes: " + govVotes  + govEloBoost
						var govDebaterEmbed1 = "Elo: "+Math.floor(govEloChange1) + " ["+Math.floor(originalGovElo1)+" ➜ " +Math.floor(R_G1)+"]" + govHighElo1 + govHighEloLifetime1
						var govDebaterEmbed2 = "Elo: "+Math.floor(govEloChange2) + " ["+Math.floor(originalGovElo2)+" ➜ " +Math.floor(R_G2)+"]" + govHighElo2 + govHighEloLifetime2;
					}
					if(govChange){
						let temp = govDebaterEmbed1;
						govDebaterEmbed1 = govDebaterEmbed2
						govDebaterEmbed2 = temp
					}
					if(oppEloChange > 0){
						var oppTeamEmbed = "Team: " + oppTeamName + " ("+oppTeamNamePing+")\nVotes: " + oppVotes + oppEloBoost
						var oppDebaterEmbed1 = "Elo: +"+Math.floor(oppEloChange1) + " ["+Math.floor(originalOppElo1)+" ➜ " +Math.floor(R_O1)+"]" + oppHighElo1 + oppHighEloLifetime1 
						var oppDebaterEmbed2 = "Elo: +"+Math.floor(oppEloChange2) + " ["+Math.floor(originalOppElo2)+" ➜ " +Math.floor(R_O2)+"]" + oppHighElo2 + oppHighEloLifetime2;
					}else{
						var oppTeamEmbed = "Team: " + oppTeamName + " ("+oppTeamNamePing+")\nVotes: " + oppVotes + oppEloBoost
						var oppDebaterEmbed1 = "Elo: "+Math.floor(oppEloChange1) + " ["+Math.floor(originalOppElo1)+" ➜ " +Math.floor(R_O1)+"]" + oppHighElo1 + oppHighEloLifetime1 
						var oppDebaterEmbed2 = "Elo: "+Math.floor(oppEloChange2) + " ["+Math.floor(originalOppElo2)+" ➜ " +Math.floor(R_O2)+"]" + oppHighElo2 + oppHighEloLifetime2;
					}
					if(oppChange){
						let temp = oppDebaterEmbed1;
						oppDebaterEmbed1 = oppDebaterEmbed2
						oppDebaterEmbed2 = temp
					}
					const embed = new EmbedBuilder()
			
				.setTitle("Round #" + roundID)
				.setDescription('Resolution: ' + resolution)
				.addFields(
					{ name: 'Government Team', value: govTeamEmbed, inline: false},
					{ name: govFirstSpeaker, value: govDebaterEmbed1, inline: false},
					{ name: govSecondSpeaker, value: govDebaterEmbed2, inline: false},
					{ name: 'Opposition Team', value: oppTeamEmbed, inline: false},
					{ name: oppFirstSpeaker, value: oppDebaterEmbed1, inline: false},
					{ name: oppSecondSpeaker, value: oppDebaterEmbed2, inline: false},
					{ name: 'Winner', value: winnerDeclaration, inline: false},
				)
					return interaction.channel.send({ embeds: [embed]});
					
				}else if(i.customId === cancelId){
					return interaction.followUp({content:"The results of the round reported by <@"+interaction.user.id+"> have been denied by <@"+i.user.id+">"})
				}
		});

			
		collector.on('end', async collected => {
	
			if(collected.size == 0){
				await interaction.editReply({components: [greyOut] });
				var temp = await mongoRounds.findOne({id: "Count"});
				var amountOfRounds = temp.count*1
				var roundID = ("0000" + amountOfRounds).slice(-5);
				var newCount = amountOfRounds + 1
					if(R_G1 > govDB1.topElo){
						var govHighElo1 = "\n" + govFullName1 + " has a new highest seasonal elo [" +Math.floor(govDB1.topElo) + " ➜ "+Math.floor(R_G1)+"]"
						await mongoUsers.updateOne({id: govDB1.id},{$set:{topElo: R_G1}} )
						var govChangeHighElo1 = true;
					}else{
						var govHighElo1 = ""
						var govChangeHighElo1 = false;
					}
					if(R_G2 > govDB2.topElo){
						var govHighElo2 = "\n" + govFullName2 + " has a new highest seasonal elo [" +Math.floor(govDB2.topElo) + " ➜ "+Math.floor(R_G2)+"]"
						await mongoUsers.updateOne({id: govDB2.id},{$set:{topElo: R_G2}} )
						var govChangeHighElo2 = true;
					}else{
						var govHighElo2 = ""
						var govChangeHighElo2 = false;
					}
					if(R_G1 > govDB1.topEloLifetime){
						var govHighEloLifetime1 = "\n" + govFullName1 + " has a new highest lifetime elo [" +Math.floor(govDB1.topEloLifetime) + " ➜ "+Math.floor(R_G1)+"]"
						await mongoUsers.updateOne({id: govDB1.id},{$set:{topEloLifetime: R_G1}} )
						var govChangeHighEloLifetime1 = true;
					}else{
						var govHighEloLifetime1 = ""
						var govChangeHighEloLifetime1 = false;
					}
					if(R_G2 > govDB2.topEloLifetime){
						var govHighEloLifetime2 = "\n" + govFullName2 + " has a new highest lifetime elo [" +Math.floor(govDB2.topEloLifetime) + " ➜ "+Math.floor(R_G2)+"]"
						await mongoUsers.updateOne({id: govDB2.id},{$set:{topEloLifetime: R_G2}} )
						var govChangeHighEloLifetime2 = true;
					}else{
						var govHighEloLifetime2 = ""
						var govChangeHighEloLifetime2 = false;
					}
					
					if(R_O1 > oppDB1.topElo){
						var oppHighElo1 = "\n" + oppFullName1 + " has a new highest seasonal elo [" +Math.floor(oppDB1.topElo) + " ➜ "+Math.floor(R_O1)+"]"
						await mongoUsers.updateOne({id: oppDB1.id},{$set:{topElo: R_O1}} )
						var oppChangeHighElo1 = true;
					}else{
						var oppHighElo1 = ""
						var oppChangeHighElo1 = false;
					}
					if(R_O2 > oppDB2.topElo){
						var oppHighElo2 = "\n" + oppFullName2 + " has a new highest seasonal elo [" +Math.floor(oppDB2.topElo) + " ➜ "+Math.floor(R_O2)+"]"
						await mongoUsers.updateOne({id: oppDB2.id},{$set:{topElo: R_O2}} )
						var oppChangeHighElo2 = true;
					}else{
						var oppHighElo2 = ""
						var oppChangeHighElo2 = false;
					}
					if(R_O1 > oppDB1.topEloLifetime){
						var oppHighEloLifetime1 = "\n" + oppFullName1 + " has a new highest lifetime elo [" +Math.floor(oppDB1.topEloLifetime) + " ➜ "+Math.floor(R_O1)+"]"
						await mongoUsers.updateOne({id: oppDB1.id},{$set:{topEloLifetime: R_O1}} )
						var oppChangeHighEloLifetime1 = true;
					}else{
						var oppHighEloLifetime1 = ""
						var oppChangeHighEloLifetime1 = false;
					}
					if(R_O2 > oppDB2.topEloLifetime){
						var oppHighEloLifetime2 = "\n" + oppFullName2 + " has a new highest lifetime elo [" +Math.floor(oppDB2.topEloLifetime) + " ➜ "+Math.floor(R_O2)+"]"
						await mongoUsers.updateOne({id: oppDB2.id},{$set:{topEloLifetime: R_O2}} )
						var oppChangeHighEloLifetime2 = true;
					}else{
						var oppHighEloLifetime2 = ""
						var oppChangeHighEloLifetime2 = false;
					}
					await mongoRounds.insertOne({id: amountOfRounds, displayID: roundID, govDebater1: govDB1.id,govDebater2: govDB2.id, oppDebater1: oppDB1.id,oppDebater2: oppDB2.id, govVotes: govVotes, oppVotes: oppVotes, resolution: resolution, date: dateFormatted, govElo1: R_G1,govElo2: R_G2,oppElo1: R_O1,oppElo2: R_O2,govEloChange1: govEloChange1, govEloChange2: govEloChange2, oppEloChange1: oppEloChange1,oppEloChange2: oppEloChange2, winner1: winner1, winner2: winner2, govBoost: govBoostBoolean,govBoosterName: govBoosterFullName, oppBoost: oppBoostBoolean,oppBoosterName: oppBoosterFullName, govChangeHighElo1: govChangeHighElo1, govChangeHighElo2: govChangeHighElo2, oppChangeHighElo1:oppChangeHighElo1,oppChangeHighElo2:oppChangeHighElo2, govChangeHighEloLifetime1: govChangeHighEloLifetime1,  govChangeHighEloLifetime2: govChangeHighEloLifetime2, oppChangeHighEloLifetime1:oppChangeHighEloLifetime1,  oppChangeHighEloLifetime2:oppChangeHighEloLifetime2, govOriginalSeasonalElo1: govDB1.topElo,govOriginalLifetimeElo1: govDB1.topEloLifetime, oppOriginalSeasonalElo1: oppDB1.topElo,oppOriginalLifetimeElo1: oppDB1.topEloLifetime, govOriginalSeasonalElo2: govDB2.topElo,govOriginalLifetimeElo2: govDB2.topEloLifetime, oppOriginalSeasonalElo2: oppDB2.topElo,oppOriginalLifetimeElo2: oppDB2.topEloLifetime})
					await mongoRounds.updateOne({id: "Count"},{$set:{count: newCount}})
					if(gov_votes > opp_votes){
						var newGovWins1 = govDB1.wins*1 + 1
						var newOppWins1 = oppDB1.wins*1
						var newGovLosses1 = govDB1.losses*1
						var newOppLosses1 = oppDB1.losses*1+1
						var newGovWins2 = govDB2.wins*1 + 1
						var newOppWins2 = oppDB2.wins*1
						var newGovLosses2 = govDB2.losses*1
						var newOppLosses2 = oppDB2.losses*1+1
					}else{
						var newGovWins1 = govDB1.wins*1
						var newOppWins1 = oppDB1.wins*1 + 1
						var newGovLosses1 = govDB1.losses*1+1
						var newOppLosses1 = oppDB1.losses*1
						var newGovWins2 = govDB2.wins*1
						var newOppWins2 = oppDB2.wins*1 + 1
						var newGovLosses2 = govDB2.losses*1+1
						var newOppLosses2 = oppDB2.losses*1
					}
					await mongoUsers.updateOne({id: govDB1.id},{$set:{elo: R_G1, wins: newGovWins1, losses: newGovLosses1, eloBoosts: govEloBoostsRemaining1}})
					await mongoUsers.updateOne({id: govDB2.id},{$set:{elo: R_G2, wins: newGovWins2, losses: newGovLosses2, eloBoosts: govEloBoostsRemaining2}})
					await mongoUsers.updateOne({id: oppDB1.id},{$set:{elo: R_O1, wins: newOppWins1, losses: newOppLosses1, eloBoosts: oppEloBoostsRemaining1}})
					await mongoUsers.updateOne({id: oppDB2.id},{$set:{elo: R_O2, wins: newOppWins2, losses: newOppLosses2, eloBoosts: oppEloBoostsRemaining2}})
					if(govEloChange > 0){
						var govTeamEmbed = "Team: " + govTeamName + " ("+govTeamNamePing+")\nVotes: " + govVotes + govEloBoost
						var govDebaterEmbed1 = "Elo: +"+Math.floor(govEloChange1) + " ["+Math.floor(originalGovElo1)+" ➜ " +Math.floor(R_G1)+"]" + govHighElo1 + govHighEloLifetime1
						var govDebaterEmbed2 = "Elo: +"+Math.floor(govEloChange2) + " ["+Math.floor(originalGovElo2)+" ➜ " +Math.floor(R_G2)+"]" + govHighElo2 + govHighEloLifetime2 ;
					}else{
						var govTeamEmbed = "Team: " + govTeamName + " ("+govTeamNamePing+")\nVotes: " + govVotes  + govEloBoost
						var govDebaterEmbed1 = "Elo: "+Math.floor(govEloChange1) + " ["+Math.floor(originalGovElo1)+" ➜ " +Math.floor(R_G1)+"]" + govHighElo1 + govHighEloLifetime1
						var govDebaterEmbed2 = "Elo: "+Math.floor(govEloChange2) + " ["+Math.floor(originalGovElo2)+" ➜ " +Math.floor(R_G2)+"]" + govHighElo2 + govHighEloLifetime2;
					}
					if(oppEloChange > 0){
						var oppTeamEmbed = "Team: " + oppTeamName + " ("+oppTeamNamePing+")\nVotes: " + oppVotes + oppEloBoost
						var oppDebaterEmbed1 = "Elo: +"+Math.floor(oppEloChange1) + " ["+Math.floor(originalOppElo1)+" ➜ " +Math.floor(R_O1)+"]" + oppHighElo1 + oppHighEloLifetime1 
						var oppDebaterEmbed2 = "Elo: +"+Math.floor(oppEloChange2) + " ["+Math.floor(originalOppElo2)+" ➜ " +Math.floor(R_O2)+"]" + oppHighElo2 + oppHighEloLifetime2;
					}else{
						var oppTeamEmbed = "Team: " + oppTeamName + " ("+oppTeamNamePing+")\nVotes: " + oppVotes + oppEloBoost
						var oppDebaterEmbed1 = "Elo: "+Math.floor(oppEloChange1) + " ["+Math.floor(originalOppElo1)+" ➜ " +Math.floor(R_O1)+"]" + oppHighElo1 + oppHighEloLifetime1 
						var oppDebaterEmbed2 = "Elo: "+Math.floor(oppEloChange2) + " ["+Math.floor(originalOppElo2)+" ➜ " +Math.floor(R_O2)+"]" + oppHighElo2 + oppHighEloLifetime2;
					}
					if(govChange){
						let temp = govDebaterEmbed1;
						govDebaterEmbed1 = govDebaterEmbed2
						govDebaterEmbed2 = temp
					}
					if(oppChange){
						let temp = oppDebaterEmbed1;
						oppDebaterEmbed1 = oppDebaterEmbed2
						oppDebaterEmbed2 = temp
					}
					const embed = new EmbedBuilder()
			
				.setTitle("Round #" + roundID)
				.setDescription('Resolution: ' + resolution)
				.addFields(
					{ name: 'Government Team', value: govTeamEmbed, inline: false},
					{ name: govFirstSpeaker, value: govDebaterEmbed1, inline: false},
					{ name: govSecondSpeaker, value: govDebaterEmbed2, inline: false},
					{ name: 'Opposition Team', value: oppTeamEmbed, inline: false},
					{ name: oppFirstSpeaker, value: oppDebaterEmbed1, inline: false},
					{ name: oppSecondSpeaker, value: oppDebaterEmbed2, inline: false},
					{ name: 'Winner', value: winnerDeclaration, inline: false},
				)
				await interaction.channel.send({content: "Neither <@"+otherDebaterID1+"> or <@"+otherDebaterID2+"> responded within 15 minutes, so round #" + roundID+" (reported by <@" +interaction.user.id+ ">) has been automatically validated."})
					return interaction.channel.send({ embeds: [embed]});
					
				
			}
		});
		}else{
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
	
			if(govDB == null && oppDB == null){
				return interaction.reply({ content: gov.username  + " and " + opp.username + " don't have Ranked PDT accounts", ephemeral: true });
			}
			if(govDB == null){
				return interaction.reply({ content: gov.username + " doesn't have a Ranked PDT account", ephemeral: true });
			}
			if(oppDB == null){
				return interaction.reply({ content: opp.username + " doesn't have a Ranked PDT account", ephemeral: true });
			}
	if(govDB.deleted || oppDB.deleted){
		return interaction.reply({ content: "At least one of these user's accounts has been deleted", ephemeral: true });
	
	}
			if(gov.id == interaction.user){
				var otherDebaterName = oppDB.firstName + " " + oppDB.lastName ;
	
			}else if(opp.id == interaction.user){
				var otherDebaterName = govDB.firstName + " " + govDB.lastName ;
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
				var oppWon = true;
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
			 interaction.channel.send({content: "<@"+otherDebaterID+"> please confirm or deny the results of this round. If you don't respond within 15 minutes, the results will be automatically validated."})
			 var filter = i => {
				if(i.customId != confirmId && i.customId != cancelId){
					return false;
				}
				if(i.user.id == otherDebaterID) return true;
				else {
				  i.reply({content: "Only " + otherDebaterName + " can confirm or deny this round's results", ephemeral: true});
				  return false;
				}
			  }
			
			var collector = interaction.channel.createMessageComponentCollector({ filter, time: 890000 });
			
			collector.on('collect', async i => {
				var temp = await mongoRounds.findOne({id: "Count"});
				await i.update({components: [greyOut] });

					var amountOfRounds = temp.count*1
					var roundID = ("0000" + amountOfRounds).slice(-5);
					var newCount = amountOfRounds + 1
					if(i.customId === confirmId){

						await interaction.followUp({content:"The results of round #"+roundID+" have been confirmed by <@"+otherDebaterID+">"})
						if(R_G > govDB.topElo){
							var govHighElo = "\n" + govFullName + " has a new highest seasonal elo [" +Math.floor(govDB.topElo) + " ➜ "+Math.floor(R_G)+"]"
							await mongoUsers.updateOne({id: govDB.id},{$set:{topElo: R_G}} )
							var govChangeHighElo = true;
						}else{
							var govHighElo = ""
							var govChangeHighElo = false;
						}
						if(R_G > govDB.topEloLifetime){
							var govHighEloLifetime = "\n" + govFullName + " has a new highest lifetime elo [" +Math.floor(govDB.topEloLifetime) + " ➜ "+Math.floor(R_G)+"]"
							await mongoUsers.updateOne({id: govDB.id},{$set:{topEloLifetime: R_G}} )
							var govChangeHighEloLifetime = true;
						}else{
							var govHighEloLifetime = ""
							var govChangeHighEloLifetime = false;
						}
						if(R_O > oppDB.topEloLifetime){
							var oppHighEloLifetime = "\n" + oppFullName + " has a new highest lifetime elo [" +Math.floor(oppDB.topEloLifetime) + " ➜ "+Math.floor(R_O)+"]"
							await mongoUsers.updateOne({id: oppDB.id},{$set:{topEloLifetime: R_O}} )
							var oppChangeHighEloLifetime = true;
						}else{
							var oppHighEloLifetime = ""
							var oppChangeHighEloLifetime = false;
						}
						if(R_O > oppDB.topElo){
							var oppHighElo = "\n" + oppFullName + " has a new highest seasonal elo [" +Math.floor(oppDB.topElo) + " ➜ "+Math.floor(R_O)+"]"
							await mongoUsers.updateOne({id: oppDB.id},{$set:{topElo: R_O}} )
							var oppChangeHighElo = true;
						}else{
							var oppHighElo = ""
							var oppChangeHighElo = false;
							
						}
						await mongoRounds.insertOne({id: amountOfRounds, displayID: roundID, govDebater: gov.id, oppDebater: opp.id, govVotes: govVotes, oppVotes: oppVotes, resolution: resolution, date: dateFormatted, govElo: R_G,oppElo: R_O,govEloChange: govEloChange, oppEloChange: oppEloChange, winner: winner, govBoost: govBoostBoolean, oppBoost: oppBoostBoolean , govChangeHighElo: govChangeHighElo, oppChangeHighElo:oppChangeHighElo, govChangeHighEloLifetime: govChangeHighEloLifetime, oppChangeHighEloLifetime:oppChangeHighEloLifetime,  govOriginalSeasonalElo: govDB.topElo,govOriginalLifetimeElo: govDB.topEloLifetime, oppOriginalSeasonalElo: oppDB.topElo,oppOriginalLifetimeElo: oppDB.topEloLifetime})
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
							var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: +"+Math.floor(govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(R_G)+"]" + govEloBoost + govHighElo + govHighEloLifetime;
						}else{
							var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: "+Math.floor(govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(R_G)+"]"+ govEloBoost + govHighElo + govHighEloLifetime;
						}
						if(oppEloChange > 0){
							var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: +"+Math.floor(oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(R_O)+"]"+oppEloBoost + oppHighElo + oppHighEloLifetime;
						}else{
							var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: "+Math.floor(oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(R_O)+"]"+oppEloBoost + oppHighElo + oppHighEloLifetime;
						}
						const embed = new EmbedBuilder()
				
					.setTitle("Round #" + roundID)
					.setDescription('Resolution: ' + resolution)
					.addFields(
						{ name: 'Government Team', value: govTeamEmbed, inline: false},
						{ name: 'Opposition Team', value: oppTeamEmbed, inline: false},
						{ name: 'Winner', value: winnerDeclaration, inline: false},
					)
						return interaction.channel.send({ embeds: [embed]});
						
					}else if(i.customId === cancelId){
						return interaction.followUp({content:"The results of the round reported by <@"+interaction.user.id+"> have been denied by <@"+otherDebaterID+">"})
					}
			});
			
			collector.on('end', async collected => {
	
				if(collected.size == 0){
					var temp = await mongoRounds.findOne({id: "Count"});
			var amountOfRounds = temp.count*1
			var roundID = ("0000" + amountOfRounds).slice(-5);
			var newCount = amountOfRounds + 1
					await interaction.editReply({components: [greyOut] });
	
					if(R_G > govDB.topElo){
						var govHighElo = "\n" + govFullName + " has a new highest seasonal elo [" +Math.floor(govDB.topElo) + " ➜ "+Math.floor(R_G)+"]"
						await mongoUsers.updateOne({id: govDB.id},{$set:{topElo: R_G}} )
						var govChangeHighElo = true;
						
					}else{
						var govHighElo = ""
						var govChangeHighElo = false;
						
					}
					if(R_G > govDB.topEloLifetime){
						var govHighEloLifetime = "\n" + govFullName + " has a new highest lifetime elo [" +Math.floor(govDB.topEloLifetime) + " ➜ "+Math.floor(R_G)+"]"
							await mongoUsers.updateOne({id: govDB.id},{$set:{topEloLifetime: R_G}} )
							var govChangeHighEloLifetime = true;
					}else{
						var govHighEloLifetime = ""
						var govChangeHighEloLifetime = false;
					}
					if(R_O > oppDB.topEloLifetime){
						var oppHighEloLifetime = "\n" + oppFullName + " has a new highest lifetime elo [" +Math.floor(oppDB.topEloLifetime) + " ➜ "+Math.floor(R_O)+"]"
						await mongoUsers.updateOne({id: oppDB.id},{$set:{topEloLifetime: R_O}} )
						var oppChangeHighEloLifetime = true;
					}else{
						var oppHighEloLifetime = ""
						var oppChangeHighEloLifetime = false;
					}
					if(R_O > oppDB.topElo){
						var oppHighElo = "\n" + oppFullName + " has a new highest elo [" +Math.floor(oppDB.topElo) + " ➜ "+Math.floor(R_O)+"]"
						await mongoUsers.updateOne({id: oppDB.id},{$set:{topElo: R_O}} )
						var oppChangeHighElo = true;
						
					}else{
						var oppHighElo = ""
						var oppChangeHighElo = false;
					}
					await mongoRounds.insertOne({id: amountOfRounds, displayID: roundID, govDebater: gov.id, oppDebater: opp.id, govVotes: govVotes, oppVotes: oppVotes, resolution: resolution, date: dateFormatted, govElo: R_G,oppElo: R_O,govEloChange: govEloChange, oppEloChange: oppEloChange, winner: winner, govBoost: govBoostBoolean, oppBoost: oppBoostBoolean , govChangeHighElo: govChangeHighElo, oppChangeHighElo:oppChangeHighElo , govChangeHighEloLifetime: govChangeHighEloLifetime, oppChangeHighEloLifetime: oppChangeHighEloLifetime,govOriginalSeasonalElo: govDB.topElo,govOriginalLifetimeElo: govDB.topEloLifetime, oppOriginalSeasonalElo: oppDB.topElo,oppOriginalLifetimeElo: oppDB.topEloLifetime})
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
			await mongoUsers.updateOne({id: govDB.id},{$set:{elo: R_G, wins: newGovWins, eloBoosts: newGovEloBoosts, losses: newGovLosses}})
			await mongoUsers.updateOne({id: oppDB.id},{$set:{elo: R_O, wins: newOppWins, eloBoosts: newOppEloBoosts,losses: newOppLosses}})
			if(govEloChange > 0){
				var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: +"+Math.floor(govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(R_G)+"]" + govHighElo + govHighEloLifetime;
			}else{
				var govTeamEmbed = "Debater: " + govFullName + " (<@"+gov.id+">)\nVotes: " + govVotes + "\nElo: "+Math.floor(govEloChange) + " ["+Math.floor(originalGovElo)+" ➜ " +Math.floor(R_G)+"]" + govHighElo + govHighEloLifetime;
			}
			if(oppEloChange > 0){
				var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: +"+Math.floor(oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(R_O)+"]" + oppHighElo + oppHighEloLifetime;
			}else{
				var oppTeamEmbed = "Debater: " + oppFullName + " (<@"+opp.id+">)\nVotes: " + oppVotes + "\nElo: "+Math.floor(oppEloChange) + " ["+Math.floor(originalOppElo)+" ➜ " +Math.floor(R_O)+"]" + oppHighElo + oppHighEloLifetime;
			}
			const embed = new EmbedBuilder()
	
		.setTitle("Round #" + roundID)
		.setDescription('Resolution: ' + resolution)
		.addFields(
			{ name: 'Government Team', value: govTeamEmbed, inline: false},
			{ name: 'Opposition Team', value: oppTeamEmbed, inline: false},
			{ name: 'Winner', value: winnerDeclaration, inline: false},
		)
			await interaction.channel.send({content: "<@"+otherDebaterID+"> didn't respond within 15 minutes, so round #" + roundID+" (reported by <@" +interaction.user.id+ ">) has been automatically validated."})
			return interaction.channel.send({ embeds: [embed]});
			
	
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
