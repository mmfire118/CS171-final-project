// init global variables & switches
let myLineVis, myLineVis2;

// load data using promises
let promises = [
  d3.csv(window.data_file_path),
  d3.json(window.word_data_file_path),
  d3.json(window.helpful_data_path)
];

$.blockUI({
  message: '<div class="d-flex justify-content-center align-items-center"><p class="me-50 mb-0">Please wait...</p> <div class="spinner-grow spinner-grow-sm text-white" role="status"></div> </div>',
  css: {
      backgroundColor: 'transparent',
      border: '0',
  },
  overlayCSS: {
      backgroundColor: '#fff',
      opacity: 0.8
  },
});

Promise.all(promises)
  .then(function (data) {
      $.unblockUI();
      initMainPage(data)
  })
  .catch(function (err) {
      $.unblockUI();
      Swal.fire({
        title: 'Error, Try Again',
        text: 'Unknown Error, Reload the Page and Try Again',
        icon: 'error',
        customClass: {
            confirmButton: 'btn btn-primary'
        },
        buttonsStyling: false,
        showClass: {
            popup: 'animate__animated animate__shakeX'
        }
      });
      console.log(err)
  });

// initMainPage
function initMainPage(dataArray) {

    let parseDate = d3.timeParse("%Y-%m-%d");

    dataArray[0].forEach(function(part, index, theArray) {
        dataArray[0][index].Timestamp = parseDate(theArray[index].Timestamp);
    })

  // init line
  myLineVis = new LineVis('main-message', "main-message-select",
      "How the Number of Item Reviews By Category Changes Over Time",
      "Number of Item Reviews (by month)",
      "sum-reviews", dataArray[0]);

  myLineVis2 = new LineVis('solution-div', "solution-select",
      "Phases of Interest: Distribution of the Average Item Rating By Category",
      "Average Review Rating (by month)",
      "avg-rating", dataArray[0])

  // init treemap
  myTreeMap = new TreeMap('rising-insight', dataArray[0])

  //init Bubbles
  myBubbleGraph = new BubbleVis('hook-div', dataArray[1])

  //init Helpful
  myHelpfulChart = new HelpfulChart('helpful-div', dataArray[2])
}

function mainMessageCatChange() {
    myLineVis.filterData();
}

function solutionCatChange() {
    myLineVis2.filterData();
}
