<% if (USE_REQUIRE_SYNTAX) { -%>
'use strict'
<% } -%>

class <%= CAPITALIZED_VIEW_NAME %> {
  constructor(params) {
    this.ready = ko.observable(true)
  }

  dispose() {

  }
}

<% if (USE_REQUIRE_SYNTAX) { -%>
module.exports = <%= CAPITALIZED_VIEW_NAME %>
<% } else { -%>  
export default <%= CAPITALIZED_VIEW_NAME %>
<% } -%>
