const { SlashCommandBuilder } = require('discord.js');
const {  ActionRowBuilder, ButtonBuilder, ButtonStyle, Events , EmbedBuilder } = require('discord.js');
mongoclient = global.mongoclient;
const mongoUsers = mongoclient.db("RankedPDT").collection("users");
const crypto = require('crypto');
module.exports = {
	
	data: new SlashCommandBuilder()
		.setName('judged')
		.setDescription('Command to claim elo boost for judging')
		.addUserOption(option => option.setName('government-team-one').setDescription('First debater on the government team').setRequired(true))
		.addUserOption(option => option.setName('opposition-team-one').setDescription('First debater on the opposition team').setRequired(true))
		.addStringOption(option => option.setName('resolution').setDescription('The resolution that was debated').setRequired(true))
		.addUserOption(option => option.setName('government-team-two').setDescription('Second debater on the government team').setRequired(false))
		.addUserOption(option => option.setName('opposition-team-two').setDescription('Second debater on the opposition team').setRequired(false)),
	async execute(interaction) {
		try{
			var gov2 = interaction.options.getUser('government-team-two');
		var opp2 = interaction.options.getUser('opposition-team-two');
		if(gov2 == null && opp2 != null){
			return interaction.reply({ content: "The round can't have 3 debaters", ephemeral: true });
		}
		if(gov2 != null && opp2 == null){
			return interaction.reply({ content: "The round can't have 3 debaters", ephemeral: true });
		}
			if(gov2!=null && opp2!=null){
				var gov1 = interaction.options.getUser('government-team-one');
				var opp1 = interaction.options.getUser('opposition-team-one');
				var resolution = interaction.options.getString('resolution');		
				var govDB1 = await mongoUsers.findOne({id: gov1.id})
				var oppDB1 = await mongoUsers.findOne({id: opp1.id})
				var govDB2 = await mongoUsers.findOne({id: gov2.id})
				var oppDB2 = await mongoUsers.findOne({id: opp2.id})
				var judgeDB = await mongoUsers.findOne({id: interaction.user.id})
				if(judgeDB == null){
					return interaction.reply({ content: "You don't have a Ranked PDT profile", ephemeral: true });
				}
				if(gov1.id == interaction.user.id || opp1.id == interaction.user.id || opp2.id == interaction.user.id || gov2.id == interaction.user.id){
					return interaction.reply({ content: "You can't judge yourself", ephemeral: true });
				}
				if(gov1.id == opp1.id || gov1.id == opp2.id || gov2.id == opp1.id || gov2.id == opp2.id || gov1.id == gov2.id || opp1.id == opp2.id){
					return interaction.reply({ content: "The debaters can't be the same person", ephemeral: true });
				}
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
				if(govDB1.deleted || oppDB1.deleted || govDB2.deleted || oppDB2.deleted){
					return interaction.reply({ content: "At least one of these user's accounts has been deleted", ephemeral: true });
				}
				let govArray = [govDB1.lastName, govDB2.lastName]
				let oppArray = [oppDB1.lastName, oppDB2.lastName]
				govArray.sort()
				oppArray.sort()
				if(govArray[0] == govDB1.lastName){
					var govTeamName = govDB1.lastName + "/" + govDB2.lastName
					var govTeamNamePings = "<@" + govDB1.id + ">, <@" + govDB2.id + ">"
				}else{
					var govTeamName = govDB2.lastName + "/" + govDB1.lastName
					var govTeamNamePings = "<@" + govDB2.id + ">, <@" + govDB1.id + ">"
				}
				if(oppArray[0] == oppDB1.lastName){
					var oppTeamName = oppDB1.lastName + "/" + oppDB2.lastName
					var oppTeamNamePings = ",<@" + oppDB1.id + ">, or <@" + oppDB2.id + ">"
				}else{
					var oppTeamName = oppDB2.lastName + "/" + oppDB1.lastName
					var oppTeamNamePings = ",<@" + oppDB2.id + ">, or <@" + oppDB1.id + ">"
				}
				var govTeamName1 = govDB1.firstName + " " + govDB1.lastName
				var govTeamName2 = govDB2.firstName + " " + govDB2.lastName
				var oppTeamName1 = oppDB1.firstName + " " + oppDB1.lastName
				var oppTeamName2 = oppDB2.firstName + " " + oppDB2.lastName

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
		 interaction.channel.send({content: govTeamNamePings + oppTeamNamePings + " please confirm or deny this information. If neither of you respond within 15 minutes, the results will be automatically validated."})
		 var filter = i => {
			if(i.customId != confirmId && i.customId != cancelId){
				return false;
			}
			if(i.user.id == gov1.id || i.user.id == opp1.id|| i.user.id == opp2.id|| i.user.id == gov2.id) return true;
			else {
			  i.reply({content: "Only " + govTeamName1 + ", "+govTeamName2+ ", "+oppTeamName1+", or " + oppTeamName2+" can confirm or deny this information", ephemeral: true});
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
			}else{


				var gov = interaction.options.getUser('government-team-one');
				var opp = interaction.options.getUser('opposition-team-one');
				var resolution = interaction.options.getString('resolution');		
				var govDB = await mongoUsers.findOne({id: gov.id})
				var oppDB = await mongoUsers.findOne({id: opp.id})
				var judgeDB = await mongoUsers.findOne({id: interaction.user.id})
		if(judgeDB == null){
			return interaction.reply({ content: "You don't have a Ranked PDT profile", ephemeral: true });
		
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
				if(govDB.deleted || oppDB.deleted){
					return interaction.reply({ content: "At least one of these user's accounts has been deleted", ephemeral: true });
				
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
