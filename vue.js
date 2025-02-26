// a vue instance with data and methods sections
const app = Vue.createApp({
  mounted() {
    this.$refs.textEditor.focus();
  },

  data() {
    return {
      textEditor: "beyonce plays texas;",
      url: [],
      videoControls: {}, // Store video control states
      errorConsole: "",
      areInstructionsVisible: true
    };
  },
  methods: {
    evaluate,
    closeInstructions(){
      this.areInstructionsVisible = false
    }, 
    
    openInstructions(){
      this.areInstructionsVisible = true

    }
  },
  computed: {
  gridStyle() {
    return {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      height: "100%",
      gap: "5px"
    };
  },
  iframeStyle() {
    const count = this.url.length;
    let size = count > 0 ? 100 / Math.ceil(Math.sqrt(count)) : 100; // Reset to full if 1 video remains

    return {
      width: `${size}%`,
      aspectRatio: "16 / 9",
      maxWidth: "100%",
      transition: "0.3s ease-in-out"
    };
  }
}

});

app.mount("#app");

const grammar = `

    sentenceOrEmptySentence = sentence/emptySentence

    sentence = (whitespace command:command whitespace semicolon whitespace newline {return command})+

    emptySentence = whitespace {return []}

    // Command Types
    command = playCommand 

    // Play a video with optional start and end times
    playCommand = artist:artist whitespace action:action whitespace video:video whitespace controls:controlsList? { 
        let result = {
            videoUrl: video,
            start: null,
            end: null,
            pause: false,
            loop: 0, 
            mute: 0
        };
        
        if (Array.isArray(controls)) {
    controls.forEach(control => {
        if (control.start !== undefined) result.start = control.start;
        if (control.end !== undefined) result.end = control.end;
        if (control.pause !== undefined) result.pause = control.pause;
        if (control.mute !== undefined) result.mute = control.mute;
        if (control.loop !== undefined) result.loop = control.loop;

});
}

        
        return result;
    }
  
 


    // Time control options
    controlsList = "(" _ list:controls|.., _ "," _| _ ")" {return list }
    controls = end / start / pause /mute / loop
    
    
    start = "start" whitespace time:number whitespace {
        return {
            start: time !== null ? time : null,
        };
    }
    
     end = "end" _ time:number _ {
        return {
            end: time !== null ? time : null
        };
    }

    
    pause = "pause" _ { 
        return {  
        pause: true
        };
        }
        
    mute = "mute" _ { 
        return {  
          mute: 1
        };
      }


    loop = "loop" _ { 
            return {  
              loop: 1
            };
          }


    // Dictionary
    artist = "beyonce"/"queen"/ "claire" / "taylor"
    action = "plays"/"sings"/ "performs" / "dances"     
    video = "texas" { return "https://www.youtube.com/embed/238Z4YaAr1g?controls=0" } /     
            "bohemian" { return "https://www.you-tube.com/embed/fJ9rUzIMcZQ?controls=0" }
            
            // /
            // "bags" {return https://www.youtube.com/embed/L9HYJbe9Y18?controls=0"} /
            // "blank space" {return "https://www.youtube.com/embed/v=e-ORhEE9VVg?controls=0"} 



    whitespace = (" ")*
    semicolon = ";"
    newline = ("\\n")*
    number =  digits:[0-9]+ { return parseInt(digits.join(""), 10); }
    _
      = [ \t]*
`;

function evaluate() {
  try {
    const parser = peggy.generate(grammar);
    const parsedCommands = parser.parse(this.textEditor);

    this.url = [];
    this.videoControls = {}; // Reset video control settings

    parsedCommands.forEach((cmd) => {
      // Get the base URL and create URL object for manipulation
      const baseUrl = new URL(cmd.videoUrl);
      const searchParams = baseUrl.searchParams;

      // Add start time if specified
      if (cmd.start !== null) {
        searchParams.set("start", cmd.start);
      }

      if (cmd.mute !== null) {
        searchParams.set("mute", cmd.mute);
      }

      // Add end time if specified
      if (cmd.end !== null) {
        searchParams.set("end", cmd.end);
      }

      // Handle autoplay

      searchParams.set("autoplay", cmd.pause ? "0" : "1");

      // Handle loop
      if (cmd.loop) {
        searchParams.set("loop", cmd.loop);
        searchParams.set('playlist', baseUrl.pathname.split('/').pop());

      }
      
       // Handle loop
            // if (cmd.loop) {
            //     searchParams.set('loop', '1');
            //     searchParams.set('playlist', baseUrl.pathname.split('/').pop());
            // }

      // Construct the final URL
      const finalUrl = baseUrl.toString();

      this.url.push(finalUrl);
      this.videoControls[finalUrl] = {
        autoplay: !cmd.pause,
        start: cmd.start,
        end: cmd.end,
        loop: cmd.loop,
        mute: cmd.mute,
      };

      this.errorConsole = "Processed URL: " + finalUrl;
    });
  } catch (error) {
    this.errorConsole = "Error: " + error.message;
  }
}
