
export class Timer {

    constructor(duration) {
        this.duration = duration
        this.remaining = duration
        this.running = true
        this.expired = false
    }

    start(io, code, onExpire) {
        this.expired = false;
        this.running = true;
        this.remaining = this.duration;


        const interval = setInterval(() => {
            // Update timer display
      
            if (this.remaining === this.duration || this.remaining == 45 || this.remaining === 30 || this.remaining === 20 || this.remaining === 10 || this.remaining === 5) {
                console.log(`${this.remaining}s remaining`)
            }
            
            // Check stop condition
            if (this.running === false) {
              clearInterval(interval);
              console.log('Timer stopped early!');
              return;
            }
        
            // Handle timer completion
            if (this.remaining <= 0) {
                this.expired = true
                clearInterval(interval);
                console.log('Timer completed!');

                //this timer expects to recieve a specific function and parameters, to run if it expires.
                onExpire(io, code)
                return;
            }
        
            this.remaining--;
          }, 1000);
        
          return interval; // Return interval ID for potential external cleanup
    }

    setDuration(new_duration) {
        this.duration = new_duration
    }

    stop() {
        this.running = false
    }
}







// function startTimer(duration, conditionCheck) {
//     let remaining = duration;
  
//     const interval = setInterval(() => {
//       // Update timer display

//       if (remaining === 45 || remaining === 30 || remaining === 10 || remaining === 5) {
//           console.log(`${remaining}s remaining`)
//       }
      
//       // Check stop condition
//       if (conditionCheck()) {
//         clearInterval(interval);
//         console.log('Timer stopped early!');
//         return;
//       }
  
//       // Handle timer completion
//       if (remaining <= 0) {
//         clearInterval(interval);
//         console.log('Timer completed!');
//         return;
//       }
  
//       remaining--;
//     }, 1000);
  
//     return interval; // Return interval ID for potential external cleanup
//   }
  
//   // Example usage:
//   let externalCondition = false;
  
//   // Start a 30-second timer that stops if externalCondition becomes true
//   const timerId = startTimer(60, () => externalCondition);
  
//   // Example condition trigger (could be a button click, API response, etc.)
//   setTimeout(() => {
//     externalCondition = true;
//   }, 15000); // Stop timer after 15 seconds in this example