(function () {

  /**
   * Update storage based on existing rows
   */
  function updateStorage () {
    let rows = []
    $('.rows .row').each(function () {
      let values = {}
      $(this).find('[name]').each(function () {
        values[$(this).attr('name')] = $(this).val()
      })
      rows.push(values)
    })
    chrome.storage.local.set({ 'scripts': rows }, function () {

    })
  }

  /**
   * Add row
   * @param {Object=} values The default values for the input fields
   */
  function addRow (values) {
    let row = $('.row-template').clone()
    row.removeClass('row-template')
    if (values) {
      for (let name in values) {
        row.find('[name=\'' + name + '\']').val(values[name])
      }
    }
    $('.rows').append(row)
  }

  $(document).on('click', '.add-row', function () {
    addRow()
    updateStorage()
  })
  $(document).on('click', '.remove-row', function () {
    $(this).closest('.row').remove()
    updateStorage()
  })
  // we save instantly when the user change something
  $(document).on('input', '.row', function () {
    updateStorage()
  })

  // create rows based on previously saved values
  chrome.storage.local.get(['scripts'], function (result) {
    if (result && result.scripts) {
      for (let i = 0; i < result.scripts.length; i++) {
        addRow(result.scripts[i])
      }
    }
  })
})()