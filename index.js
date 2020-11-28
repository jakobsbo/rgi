var vote_data = [];
var collection_data = [];
var review_data = [];
var collection_webflow_uids = [];
var selected = [];
var edit = [];

function esc(string) {
  return string.replace(/[`~@#$%^&*()_|+\-=;:'"<>\{\}\[\]\\\/]/gi, "");
}

document.addEventListener("DOMContentLoaded", function (event) {
  $(document).ready(function () {
    var clipboard = new Clipboard("[copy-url-btn]");
    clipboard.on("success", function (e) {
      console.log(e);
      success("Shareable link was copied to clipboard.");
    });
    clipboard.on("error", function (e) {
      console.log(e);
    });

    let inline_timer = null;
    $("#wf-form-edit-collection").on(
      "keyup change paste",
      "input, select, textarea",
      function () {
        clearTimeout(inline_timer);
        inline_timer = setTimeout(function () {
          console.log("Form changed!");
          updateCollection(
            "content",
            selected.collection_id,
            esc($("[create-collection-name]").val()),
            esc($("[create-collection-description]").val()),
            $("[create-collection-checkbox]").is(":checked")
          );
          success("Collection updated.");
        }, 1200);
      }
    );
 
    MemberStack.onReady.then(async function (member) {
      if (memberstack.isAuthenticated) {
        var metadata = await member.getMetaData();
        vote_data = member["vote-data"];
        collection_data = member["collection-data"];
        review_data = member["review-data"];
        collection_webflow_uids = member["collection-webflow-uids"] + "";
        edit = metadata.edit;

        if (!vote_data) {
          vote_data = [];
        } else {
          vote_data = Array.from(vote_data);
        }
        if (!collection_data) {
          collection_data = [];
        } else {
          collection_data = Array.from(collection_data);
        }
        if (!review_data) {
          review_data = [];
        } else {
          review_data = Array.from(review_data);
        }
        if (!collection_webflow_uids) {
          collection_webflow_uids = [];
        } else {
          collection_webflow_uids = collection_webflow_uids.split(",");
        }
        if (!selected) {
          selected = [];
        } else {
          selected = Array.from(selected);
        }
        console.log("loaded" + collection_data);

        if (!edit) {
          console.log("noedit");
        } else {
          editCollection(edit);
        }

        listCounters();
        $("[nav-profile]").show();
      } else {
        checkLimit();
      }
    });
  });
});

function selectItem(id, name, link, action) {
  MemberStack.onReady.then(async function (member) {
    console.log("selected " + id);
    selected = { id: id, name: name, link: link, action: action };
    member.updateMetaData({
      selected: { id: id, name: name, link: link, action: action }
    });
  });
}

function createCollection(name, description, hidden) {
  console.log(name, description, hidden);
  MemberStack.onReady.then(async function (member) {
    var color = hex(Math.floor(360 * Math.random()), 70, 90);
    var id = uniqId();
    var slug = toSlug(name.split(" ")[0] + "-" + uniqId());
    var link = "https://www.reallygoodinnovation.com/collections/" + slug;

    collection = {
      id: id,
      name: name,
      description: description,
      link: link,
      hidden: hidden,
      slug: slug,
      color: color,
      count: 0
    };

    collection_data.push({
      id: id,
      name: name,
      description: description,
      link: link,
      hidden: hidden,
      slug: slug,
      color: color,
      count: 0,
      items: []
    });
    console.log("col data" + collection_data);
    console.log("col" + collection);

    member.updateProfile(
      {
        collections: collection_data.length,
        "collection-data": Array.from(collection_data),
        "update-data": collection,
        "update-action": "new-collection"
      },
      false
    );

    success("Creating " + name + "...");
    setEdit(id);

    setTimeout(function () {
      location.reload();
    }, 2000);
  });
}

function deleteCollection(id) {
  console.log("deleting collection " + id);
  MemberStack.onReady.then(async function (member) {
    var col_index;
    var name;
    for (i = 0; i < collection_data.length; i++) {
      if (collection_data[i].id == id) {
        col_index = i;
        name = collection_data[i].name;
      }
    }

    wf_id = collection_webflow_uids[col_index];
    collection_webflow_uids.splice(col_index, 1);

    if (col_index > -1) {
      console.log("col data" + collection_data);
      collection_data.splice(col_index, 1);
      console.log("col data" + collection_data);
      member.updateProfile(
        {
          collections: collection_data.length,
          "collection-data": Array.from(collection_data),
          "collection-webflow-uids": collection_webflow_uids,
          "update-item": wf_id,
          "update-action": "delete-collection"
        },
        false
      );

      success("Deleted " + name + "...");

      setEdit("");

      listCollections();
      $("[bar-edit-collection]").hide();
      $("[bar-view-collections]").fadeIn(300);
    }
  });
}

function updateCollection(action, collection_id, title, description, hidden) {
  console.log("collection id" + collection_id);
  MemberStack.onReady.then(async function (member) {
    var metadata = await member.getMetaData();
    var item = selected;
    console.log("adding selected id" + item.name + item.id + item.link);

    var col_index = "";
    var collection_items = "[";
    for (i = 0; i < collection_data.length; i++) {
      if (collection_data[i].id == collection_id) {
        col_index = i;
        var ids = [];

        items = Array.from(collection_data[i].items);
        for (y = 0; y < items.length; y++) {
          ids.push(items[y].id);
        }
        console.log(ids);
        console.log(action);

        if (action == "content") {
          console.log("content" + collection_data[i]);
          (collection_data[i].name = esc($("[edit-collection-name]").val())),
            (collection_data[i].description = esc(
              $("[edit-collection-description]").val()
            )),
            (collection_data[i].hidden = String(
              $("[edit-collection-checkbox]").is(":checked")
            ).toLowerCase()),
            console.log("content" + collection_data[i]);
        }

        if (action == "remove") {
          console.log("remove");
          if (ids.includes(item.id)) {
            success("Removing item");
            var pos = ids.indexOf(item.id);
            collection_data[i].items.splice(pos, 1);
            ids.splice(pos, 1);
            console.log(collection_data);
            console.log(collection_items);
          } else {
            success(item.name + " not in collection.");
          }
        }

        if (action == "add") {
          console.log("add");

          if (ids.includes(item.id)) {
            success("Already in the collection");
          } else {
            collection_data[i].items.push({
              id: item.id,
              name: item.name,
              link: item.link
            });
            ids.push(item.id);
            console.log(collection_data);
            console.log(collection_items);
            success(item.name + " added to collection");
          }
        }
        if (ids.length > 0) {
          collection_items = '["' + ids.join('","') + '"';
          console.log("collection items" + collection_items);
        }
        selected.collection_items = collection_data[i].items;
      }
    }

    var webflow_collection_id = "";
    if (col_index > -1) {
      collection_data[col_index].count =
        collection_data[col_index].items.length;
      webflow_collection_id = collection_webflow_uids[col_index];
    }

    member.updateProfile(
      {
        collections: collection_data.length,
        "collection-data": Array.from(collection_data),
        "update-item": collection_items,
        "update-action": "update-collection",
        "update-data": {
          webflowcollectionid: webflow_collection_id,
          collectionid: collection_id,
          name: esc($("[edit-collection-name]").val()),
          description: esc($("[edit-collection-description]").val()),
          hidden: String(
            $("[edit-collection-checkbox]").is(":checked")
          ).toLowerCase(),
          items: collection_items
        }
      },
      false
    );

    listCounters();
    listItems();
  });
}

function listCollections() {
  $("[collection-clone]").each(function (index) {
    $(this).remove();
  });

  var original = $("[collection-original]");
  original.hide();

  for (i = 0; i < collection_data.length; i++) {
    original.clone().appendTo("[collections-list]");
  }

  $("[collection-div]").each(function (index) {
    if (index == 0) {
      $(this).hide();
    } else {
      $(this)
        .find("[collection-count]")
        .text(collection_data[index - 1].count + " resources");
      $(this)
        .find("[collection-name]")
        .text(collection_data[index - 1].name);
      $(this).attr("cid", collection_data[index - 1].id);
      $(this).css("background-color", collection_data[index - 1].color);
      $(this).attr("collection-clone", "true");
      $(this).removeAttr("collection-original");
      $(this).click(function () {
        var cid = $(this).attr("cid");

        editCollection(cid);
      });

      if (collection_data[index - 1].hidden == "false") {
        $(this).find("[lock-icon]").hide();
      }
      $(this).fadeIn(index * 50);
    }
  });
}

function listCounters() {
  var vote_ids = [];
  for (i = 0; i < vote_data.length; i++) {
    vote_ids.push(vote_data[i].id);
  }
  $("[vote-div]").each(function (index) {
    var id = $(this).attr("item-id");
    if (vote_ids.includes(id)) {
      $(this).addClass("active");
    } else {
      $(this).removeClass("active");
    }
  });
}

function wall(message) {
  if (
    /bot|google|baidu|bing|msn|teoma|slurp|yandex/i.test(navigator.userAgent)
  ) {
  } else {
    $("[wall-message]").text(message);
    $("[modals-div]").css("display", "flex");
    $("[modals-div]").fadeIn(500);
    $("[modal-wall]").fadeIn(800);
    $(".w-container").addClass("blur-all");
  }
}

function setEdit(id) {
  edit = id;
  MemberStack.onReady.then(async function (member) {
    member.updateMetaData({
      edit: id
    });
  });
}

function hideBottomBar() {
  $("[bottom-bar]").fadeOut(300);
  $("[bar-edit-collection]").slideUp();
  $("[bar-view-collections]").slideUp();
}

function hideModals() {
  if (memberstack.isAuthenticated || sessionStorage.timelimit < 45000) {
    $(".w-container").removeClass("blur-all");
    $("[modals-div]").fadeOut(100);
    $("[modal-review]").fadeOut(100);
    $("[modal-collection]").fadeOut(100);
    $("[modal-wall]").fadeOut(100);
    $("[modal-share]").fadeOut(100);
    $("[modal-signup-create]").fadeOut(100);
    $("[modal-exit-intent]").fadeOut(100);
    resetReview();
  }
}

function checkLimit() {
  if (isNaN(sessionStorage.timelimit)) {
    sessionStorage.timelimit = 0;
  }
  if (sessionStorage.timelimit > 45000) {
    wall("Create a free account or log in to browse more resources.");
  } else {
    setTimeout(function () {
      sessionStorage.timelimit = Number(sessionStorage.timelimit) + 8000;
      checkLimit();
    }, 8000);
  }
}

function editCollection(id) {
  setEdit(id);
  $("[bottom-bar]").css("display", "block");
  $("[bar-view-collections]").hide();
  $("[bar-edit-collection]").show();
  selected.collection_id = id;
  selected.collection_items = [];

  for (i = 0; i < collection_data.length; i++) {
    if (collection_data[i].id == id) {
      $("[edit-collection-name]").val(collection_data[i].name);
      $("[edit-collection-description]").val(collection_data[i].description);
      $("[share-collection-url]").text(collection_data[i].link);
      $("[share-collection-link]").attr("href", collection_data[i].link);
      $("[copy-url-btn]").attr("data-clipboard-text", collection_data[i].link);
      var check = collection_data[i].hidden == "true";

      $("[edit-collection-checkbox]").prop("checked", check);

      if (selected.name) {
        $("[add-item-button]").attr("add-item-button", collection_data[i].id);
        $("[add-item-title]").text(selected.name);
        $("[add-item-button]").css("display", "block");
      } else {
        $("[add-item-button]").hide();
      }

      selected.collection_items = collection_data[i].items;
    }
  }
  listItems();
}

function listItems() {
  $("[item-clone]").each(function (index) {
    $(this).remove();
    console.log("removing a clone" + index);
  });

  var original = $("[item-original]");
  original.hide();

  for (i = 0; i < selected.collection_items.length; i++) {
    console.log("creating a new div");
    original.clone().appendTo("[items-list]");
  }

  $("[item-div]").each(function (index) {
    if (index == 0) {
      $(this).hide();
      console.log("hiding original" + index);
    } else {
      console.log("changing clone" + index);
      $(this).attr("item-clone", "true");
      $(this).removeAttr("item-original");
      $(this)
        .find("[item-name]")
        .text(selected.collection_items[index - 1].name);
      $(this)
        .find("[item-name]")
        .attr("href", selected.collection_items[index - 1].link);
      $(this)
        .find("[item-delete]")
        .attr("item", selected.collection_items[index - 1].id);
      $(this).find("[item-delete]").attr("collection", selected.collection_id);

      $(this)
        .find("[item-dropdown]")
        .attr("id", "dropdown" + selected.collection_items[index - 1].id);
      $(this)
        .find("[item-toggle]")
        .attr("id", "toggle" + selected.collection_items[index - 1].id);
      $(this)
        .find("[item-list]")
        .attr("id", "list" + selected.collection_items[index - 1].id);

      $(this)
        .find("[item-delete]")
        .click(function () {
          var collection = $(this).attr("collection");
          selected.id = $(this).attr("item");
          updateCollection("remove", collection, "unset", "unset", "unset");
        });

      $(this).fadeIn(index * 50);
    }
  });
}





//jQuery clicks start
document.addEventListener("DOMContentLoaded", function (event) {
  
$("[view-collections-close]").click(function () {
  hideBottomBar();
});

$("[back-to-collections]").click(function () {
  setEdit("");
  $("[bar-edit-collection]").hide();
  $("[bar-view-collections]").fadeIn(300);
  listCollections();
});

$("[edit-collection-close]").click(function () {
  setEdit("");
  hideBottomBar();
});

$("[add-item-button]").click(function () {
  var id = $(this).attr("add-item-button");
  console.log("adding" + id);
  updateCollection("add", id, "unset", "unset", "unset");
  $("[add-item-button]").hide();
});

$("[rate-value]").click(function () {
  var value = $(this).attr("rate-value");
  console.log("rate-value clicked" + value);

  $(this)
    .closest("[rate-check-div]")
    .find(".rate-check")
    .each(function (index) {
      var rate = $(this);
      var number = rate.find("[rate-value]").attr("rate-value");
      var button = rate.find(".rate-check-button");
      if (number < value + 1) {
        rate.removeClass("grey");
      } else {
        rate.addClass("grey");
      }
    });
  $(this).closest("[rate-check-div]").find("[rate-field]").val(value);
  $("[rate-submit-btn]").show();
  $(this).attr("checked", false);
});

$("[hide-modals]").click(function () {
  hideModals();
});

$("[create-collection-button]").click(function () {
  $("[modals-div]").css("display", "flex");
  $("[bar-view-collections]").hide();
  $("[modal-collection]").fadeIn(300);
});

$("[hide-create-collection]").click(function () {
  $("[modal-collections]").fadeIn(300);
  $("[modal-collection]").fadeOut(100);
});

$("[review-div]").click(function () {
  var id = $(this).closest("[counter-div]").find("[counter-id]").text();
  var name = $(this).closest("[counter-div]").find("[counter-name]").text();
  var link = $(this).closest("[counter-div]").find("[counter-link]").text();
  selectItem(id, name, link, "review");
  $("[modals-div]").css("display", "flex");
  $("[modal-review]").fadeIn(200);
});

$("[share-div]").click(function () {
  if (memberstack.isAuthenticated) {
    shareItem(
      $(this).attr("item-id"),
      $(this).attr("item-name"),
      $(this).attr("item-link"),
      $(this).attr("item-image")
    );
  }
  $(this).text(Number($(this).text()) + 1);
  $("[modals-div]").css("display", "flex");
  $("[modal-share]").fadeIn(200);
});

$("[vote-div]").click(function () {
  if (memberstack.isAuthenticated) {
    voteItem(
      $(this).attr("item-id"),
      $(this).attr("item-name"),
      $(this).attr("item-link")
    );
    if ($(this).hasClass("active")) {
      $(this).text(Number($(this).text()) - 1);
    } else {
      $(this).text(Number($(this).text()) + 1);
    }
    $(this).toggleClass("active");
  } else {
    wall("Sign up to upvote " + $(this).attr("item-name") + ".");
  }
});

$("[collect-div]").click(function () {
  if (memberstack.isAuthenticated) {
    var id = $(this).attr("item-id");
    var name = $(this).attr("item-name");
    var link = $(this).attr("item-link");
    selectItem(id, name, link, "collect");

    if (collection_data.length > 0) {
      if (edit) {
        console.log("adding" + id);
        updateCollection("add", edit, "unset", "unset", "unset");
        $("[add-item-button]").hide();
      } else {
        listCollections();
        $("[bottom-bar]").fadeIn(200);
        $("[bar-view-collections]").slideDown();
      }
    } else {
      $("[bar-view-collections]").hide();
      $("[modals-div]").css("display", "flex");
      $("[modal-collection]").fadeIn(300);
    }
  } else {
    wall("Sign up to add " + $(this).attr("item-name") + " to a collection.");
  }
});

$("#wf-form-edit-collection").submit(function (event) {
  deleteCollection(selected.collection_id);
  return false;
});

$("#wf-form-create-collection").submit(function (event) {
  createCollection(
    esc($("[create-collection-name]").val()),
    esc($("[create-collection-description]").val()),
    $("[create-collection-checkbox]").is(":checked")
  );
  $("[create-collection-name]").val("");
  $("[create-collection-description]").val("");
  return false;
});

$("#wf-form-create-review").submit(function (event) {
  var data = $("#wf-form-create-review")
    .serializeArray()
    .reduce(function (obj, item) {
      obj[item.name] = item.value;
      return obj;
    }, {});
  createReview(
    data.itemid,
    data.itemname,
    data.itemlink,
    data.quality,
    data.actionable,
    data.ease,
    data.money,
    data.pros,
    data.cons
  );
  hideModals();
  resetReview();
  console.log(data);
  return false;
});

$("[dropdown-votes]").click(function () {
  listVotes();
});

$("[wall]").click(function () {
  wall("Sign up to continue.");
});
  
}//jquery clicks end. 

