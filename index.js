const { React } = require("powercord/webpack");
const { Plugin } = require("powercord/entities");

const Settings = require("./Settings.jsx");
let reminderCheck;

module.exports = class RemindMe extends Plugin {
  startPlugin() {
    !this.settings.get("reminders") && this.settings.set("reminders", "[]");
    powercord.api.settings.registerSettings("remind-me", {
      category: this.entityID,
      label: "Remind Me",
      render: Settings,
    });
    powercord.api.commands.registerCommand({
      command: "reminders",
      description: "Show all active reminders.",
      usage: "{c}",
      executor: () => {
        let result;

        const reminders = JSON.parse(this.settings.get("reminders"));

        if (!reminders.length) {
          result = {
            type: "rich",
            title: "Reminders",
            description: "There are no active reminders.",
            footer: {
              text: `Say ${powercord.api.commands.prefix}remind to set a reminder.`,
            },
          };
        } else {
          result = {
            type: "rich",
            title: "Reminders",
            description: "Here's a list of all active reminders:",
            fields: [
              {
                name: "Time*",
                value: reminders.map((re) => re.duration).join("\n\n"),
                inline: true,
              },
              {
                name: "Message",
                value: reminders.map((re) => re.message).join("\n\n"),
                inline: true,
              },
            ],
            footer: {
              text:
                "*The exact time that the reminder will be triggered, not how much time until.",
            },
          };
        }

        return {
          send: false,
          result,
        };
      },
    });
    powercord.api.commands.registerCommand({
      command: "remind",
      aliases: ["reminder"],
      description: "Remind yourself something later.",
      usage: "{c} <duration> <message>",
      executor: (args) => {
        let result;

        if (args.length < 2) {
          result = {
            type: "rich",
            title: "Remind Command",
            description: "Please input a `<duration>` and a `<message>`.",
            footer: {
              text: `Say ${powercord.api.commands.prefix}help remind to see this command's usage.`,
            },
          };
        } else {
          try {
            let duration = args[0];
            const today = new Date();
            switch (duration.replace(/[0-9]/g, "")) {
              case "s":
                if (today.getSeconds() + parseInt(duration) > 59) {
                  duration = today.getSeconds() + parseInt(duration) + "s+";
                } else {
                  duration = today.getSeconds() + parseInt(duration) + "s";
                }
                break;
              case "m":
                if (today.getMinutes() + parseInt(duration) > 59) {
                  duration = today.getMinutes() + parseInt(duration) + "m+";
                } else {
                  duration = today.getMinutes() + parseInt(duration) + "m";
                }
                break;
              case "h":
                if (today.getHours() + parseInt(duration) > 23) {
                  duration = today.getHours() + parseInt(duration) + "h+";
                } else {
                  duration = today.getHours() + parseInt(duration) + "h";
                }
                break;
            }

            const message = args.slice(1).join(" ");
            const comma = this.settings.get("reminders").length > 2 ? ", " : "";
            this.settings.set(
              "reminders",
              "[" +
                this.settings
                  .get("reminders")
                  .slice(1, this.settings.get("reminders").length - 1) +
                comma +
                JSON.stringify({ message, duration }) +
                "]"
            );
            result = {
              type: "rich",
              title: "Reminder set!",
              description: `I will remind you "${message}" in ${args[0]}.`,
            };
          } catch (e) {
            result = {
              type: "rich",
              title: "Reminder set failed!",
              description: `I failed to set your reminder! Try again later.\n\`\`\`js\n${e}\`\`\``,
            };
          }
        }

        return {
          send: false,
          result,
        };
      },
      autocomplete: (args) => {
        if (args[1] === void 0) {
          return {
            commands: [
              {
                command: "Enter the duration of your reminder...",
                instruction: true,
              },
            ],
          };
        }

        if (args[2] === void 0) {
          return {
            commands: [
              {
                command: `Enter a message for your ${args[0]} reminder...`,
                wildcard: true,
                instruction: true,
              },
            ],
          };
        }
      },
    });

    reminderCheck = setInterval(() => {
      try {
        const reminders = JSON.parse(this.settings.get("reminders"));

        const Remind = (reminder) => {
          powercord.api.notices.sendToast("remind-me", {
            header: "Reminder",
            content: reminder.message,
            type: "warning",
            buttons: [
              {
                text: "Dismiss",
                color: "red",
                size: "medium",
                look: "outlined",
              },
            ],
          });
          if (this.settings.get("makeSound", true)) {
            let sound;
            switch (this.settings.get("reminderSound", 0)) {
              case 0:
                sound = new Audio(
                  "/assets/15fe810f6cfab609c7fcda61652b9b34.mp3"
                );
                break;
              case 1:
                sound = new Audio(
                  "/assets/53ce6a92d3c233e8b4ac529d34d374e4.mp3"
                );
                break;
              case 2:
                sound = new Audio(
                  "/assets/fa4d62c3cbc80733bf1f01b9c6f181de.mp3"
                );
                break;
              case 3:
                sound = new Audio(
                  "/assets/a5f42064e8120e381528b14fd3188b72.mp3"
                );
                break;
              case 4:
                sound = new Audio(
                  "/assets/ad322ffe0a88436296158a80d5d11baa.mp3"
                );
                break;
            }
            sound.play();
          }

          this.settings.set(
            "reminders",
            JSON.stringify(
              reminders.filter(function (value, index, arr) {
                return value != reminder;
              })
            )
          );
        };

        reminders.forEach((reminder) => {
          switch (reminder.duration.replace(/[0-9]/g, "")) {
            case "s":
              if (parseInt(reminder.duration) <= new Date().getSeconds()) {
                Remind(reminder);
              }
              break;
            case "s+":
              if (parseInt(reminder.duration) - 60 <= new Date().getSeconds()) {
                Remind(reminder);
              }
              break;
            case "m":
              if (parseInt(reminder.duration) <= new Date().getMinutes()) {
                Remind(reminder);
              }
              break;
            case "m+":
              if (parseInt(reminder.duration) - 60 <= new Date().getMinutes()) {
                Remind(reminder);
              }
              break;
            case "h":
              if (parseInt(reminder.duration) <= new Date().getHours()) {
                Remind(reminder);
              }
              break;
            case "h+":
              if (parseInt(reminder.duration) - 24 <= new Date().getHours()) {
                Remind(reminder);
              }
              break;
          }
        });
      } catch (e) {
        console.error(e);
      }
    }, 1000);
  }

  pluginWillUnload() {
    powercord.api.settings.unregisterSettings("remind-me");
    powercord.api.commands.unregisterCommand("reminders");
    powercord.api.commands.unregisterCommand("remind");
    clearInterval(reminderCheck);
  }
};
