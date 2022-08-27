const { Plugin } = require("powercord/entities");

const Settings = require("./components/Settings.jsx");
const indicators = {
  "s": ["getSeconds", "setSeconds"],
  "m": ["getMinutes", "setMinutes"],
  "h": ["getHours", "setHours"],
  "d": ["getHours", "setHours", 24],
  "w": ["getHours", "setHours", 24 * 7],
  "M": ["getHours", "setHours", 24 * 28],
  "y": ["getHours", "setHours", 24 * 336]
};

let reminderCheck;

module.exports = class RemindMe extends Plugin {
  startPlugin() {
    !this.get() && this.set([]);
    powercord.api.settings.registerSettings("remind-me", {
      category: this.entityID,
      label: "Remind Me",
      render: Settings
    });
    powercord.api.commands.registerCommand({
      command: "remind",
      aliases: ["reminder"],
      description: "Remind yourself about something later.",
      usage: '{c} [time] [message]',
      executor: this.run.bind(this),
      autocomplete: this.autocomplete.bind(this)
    });

    reminderCheck = setInterval(() => {
      try {
        const reminders = this.get();
        let snoozeDuration = this.settings.get("snooze_duration", 5);

        const Remind = reminder => {
          powercord.api.notices.sendToast("remind-me", {
            header: "Reminder",
            content: reminder.message,
            type: "warning",
            buttons: [
              {
                text: "Dismiss",
                color: "red",
                size: "medium",
                look: "outlined"
              },
              {
                text: `Snooze (${snoozeDuration}m)`,
                color: "blue",
                size: "medium",
                look: "outlined",
                onClick: () => {
                  let time = new Date();
                  time.setMinutes(time.getMinutes() + snoozeDuration)
                  this.apply(reminder.message, time)
                }
              }
            ]
          });
          if (this.settings.get("makeSound", true)) {
            new Audio(
              [
                "/assets/15fe810f6cfab609c7fcda61652b9b34.mp3",
                "/assets/53ce6a92d3c233e8b4ac529d34d374e4.mp3",
                "/assets/fa4d62c3cbc80733bf1f01b9c6f181de.mp3",
                "/assets/a5f42064e8120e381528b14fd3188b72.mp3",
                "/assets/ad322ffe0a88436296158a80d5d11baa.mp3"
              ][this.settings.get("reminderSound", 0)]
            ).play();
          }

          this.remove(reminder)
        };

        reminders.forEach(reminder => {
          let duration;
          try {
            duration = new Date(reminder.duration).getTime();
          } catch (error) {
            return console.error(error)
          }
          if (duration < new Date().getTime())
            Remind(reminder);
        });
      } catch (e) {
        console.error(e);
      }
    }, 1000);
  }

  /**
   * 
   * @param {Date} now 
   * @param {Date} then 
   */
  until(now, then) {
    try {
      typeof now == 'string' && (now = new Date(now));
      typeof then == 'string' && (then = new Date(then));
    } catch (error) {
      return error;
    }

    let remaining = then.getTime() - now.getTime();
    let s = Math.floor(remaining /= 1e3) % 60,
      m = Math.floor(remaining /= 60) % 60,
      h = Math.floor(remaining /= 60) % 24,
      d = Math.floor(remaining /= 24) % 7,
      w = Math.floor(remaining /= 7) % 4,
      M = Math.floor(remaining /= 4) % 12,
      y = Math.floor(remaining /= 12),
      str = '';


    for (let [val, name] of [
      [y, "year"],
      [M, "month"],
      [w, "week"],
      [d, "day"],
      [h, "hour"],
      [m, "minute"],
      [s, "second"]
    ]) {
      val && (
        str += `${str.length ? ', ' : ''}${val} ${name}${val == 1 ? '' : 's'}`
      );
    }

    return str;
  }

  get() {
    const set = this.settings.get("reminders")
    return set ? JSON.parse(set) : false;
  }

  apply(message, duration) {
    this.settings.set("reminders", JSON.stringify(
      [...this.get(), { message, duration }]
    ));
  }

  set(reminders) {
    this.settings.set("reminders", JSON.stringify(reminders));
  }

  remove(index, result = false) {
    if (typeof index == "object") index = this.get().indexOf(index)
    let reminders = this.get();
    let reminder = reminders.splice(index, 1)[0];
    this.set(reminders);

    if (result)
      return {
        type: "rich",
        title: "Reminder removed!",
        description: `Reminder "${reminder.message}" was removed!`
      }
  }

  add(args) {
    const now = new Date();

    let duration = new Date(now),
      reg = /(?<time>[0-9]*)(?<indicator>[smhdwMy])/g;
    let match = null,
      tmp = [];

    while ((match = reg.exec(args.join(" "))) !== null) {
      if (match.index === reg.lastIndex) reg.lastIndex++;

      let { time, indicator } = match.groups;
      if (!time || !indicator) continue;
      if (!Object.hasOwnProperty.call(indicators, indicator)) continue;
      let ind = indicators[indicator];
      // Example: date.setMonth(date.getMonth() + time ?* multiplier)
      duration[ind[1]](
        duration[ind[0]]()
        +
        time * (ind[2] || 1)
      );
      // Store the time string to remove later
      tmp.push(match[0])
    }
    
    // Remove all references to time so they don't get combined with the message
    while(tmp.length) (args.splice(args.indexOf(tmp.pop()), 1))

    if (now.getTime() == duration.getTime())
      return {
        send: false,
        type: 'rich',
        description: 'Enter the duration of your reminder...'
      };
    if (!args.length)
      return {
        send: false,
        type: 'rich',
        description: `Enter a message for your ${this.until(now, duration)} reminder...`
      };

    let message = args.join(" ");

    this.apply(message, duration)

    return {
      send: false,
      type: "rich",
      title: "Reminder set!",
      description: `I will remind you "${message}" in ${this.until(now, duration)}.`
    };

  }

  list() {
    const reminders = this.get();
    let now = Date();

    return reminders.length
      ? {
        type: "rich",
        title: "Reminders",
        description: "Here's a list of all active reminders:",
        fields: [
          {
            name: "Time",
            value: reminders.map(re => this.until(now, re.duration)).join("\n\n"),
            inline: true
          },
          {
            name: "Message",
            value: reminders.map(re => re.message).join("\n\n"),
            inline: true
          }
        ],
      } : {
        type: "rich",
        title: "Reminders",
        description: "There are no active reminders.",
        footer: {
          text: `Say ${powercord.api.commands.prefix}remind to set a reminder.`
        }
      };
  }

  run(args) {
    let result;

    if (args.length < 1) return {
      send: false,
      result: {
        type: "rich",
        title: "Remind Command",
        description: "Please select which option you would like!",
        footer: {
          text: `Say ${powercord.api.commands.prefix}help remind to see this command's usage.`
        }
      }
    };

    try {
      switch (args.shift()) {
        case 'add':
          result = this.add(args);
          break;
        case 'list':
          result = this.list();
          break;
        case 'remove':
          result = this.remove(args[0], true)
          break;
        case 'clear':
          this.set([]);
          result = {
            type: "rich",
            title: "Reminders removed!",
            description: "All of your reminders have been removed!"
          }
      }
    } catch (e) {
      result = {
        type: "rich",
        title: "Error!",
        description: `An error has occurred!  Try again later.\n\`\`\`js\n${e}\`\`\``
      };
    }


    return {
      send: false,
      result
    };
  }

  autocomplete(args) {
    let options = {};
    switch (args.length) {
      case 1:
        options = {
          add: 'Adds a Reminder',
          list: 'Show all active reminders',
          remove: 'Removes a reminder',
          clear: 'Removes all reminders'
        };
        break;
      case 2:
        if (args[0] == "remove")
          this.get().forEach((reminder, index) => {
            options[index] = `${reminder.message} - ${this.until(new Date(), new Date(reminder.duration))}`;
          });
        else return false;
        break;
      default:
        return false;
    }

    return {
      commands: Object.keys(options)
        .filter(option => option.includes(args[args.length - 1].toLowerCase()))
        .map(option => ({
          command: option,
          description: options[option]
        })),
      header: 'Quick Status'
    };
  }

  pluginWillUnload() {
    powercord.api.settings.unregisterSettings("remind-me");
    powercord.api.commands.unregisterCommand("remind");
    clearInterval(reminderCheck);
  }
};
