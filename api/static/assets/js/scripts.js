// init global variables & switches
let myLineVis

// load data using promises
let promises = [
  d3.csv(window.data_file_path),
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

  // log data
  console.log('check out the data', dataArray[0]);

  // init line
  myLineVis = new LineVis('main-message', dataArray[0])

  // init treemap
  myTreeMap = new TreeMap('rising-insight', dataArray[0])
}

