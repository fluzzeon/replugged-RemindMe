const { React } = require("powercord/webpack");
const { SwitchItem, SelectInput } = require("powercord/components/settings");

module.exports = class Settings extends React.Component {
  render() {
    const { getSetting, updateSetting, toggleSetting } = this.props;
    return (
      <div>
        <SwitchItem
          note="If toggled, a sound will play whenever a reminder is triggered."
          value={getSetting("makeSound", true)}
          onChange={() => toggleSetting("makeSound")}
        >
          Make Sound
        </SwitchItem>
        {getSetting("makeSound", true) && (
          <SelectInput
            note="Choose what sound you want to play. (You can listen to a sound by clicking on the option.)"
            options={[
              { label: "Alternate Ping 1", value: 0 },
              { label: "Alternate Ping 2", value: 1 },
              { label: "Unused Mention 1", value: 2 },
              { label: "Unused Mention 2", value: 3 },
              { label: "Secret Unlocked!", value: 4 },
            ]}
            value={getSetting("reminderSound", 0)}
            onChange={(o) => {
              updateSetting("reminderSound", o.value);

              let sound;
              switch (getSetting("reminderSound", 0)) {
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
            }}
          >
            Reminder Sound
          </SelectInput>
        )}
      </div>
    );
  }
};
