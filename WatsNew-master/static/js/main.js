function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

var concept_ids = {};
var graph;

$("#search_text").on("keyup", function(e){
    if(e.keyCode === 13) $("#search_btn").trigger("click");
});

$("#search_btn").on("click", function(){

    concept_ids = {};

    // get the text from the form value
    var search_text = $("#search_text").val().trim();

    // check to see whether there has been a query entered
    if (search_text.length <= 0) return false;

    graph = new Springy.Graph();
    var nodes_list = {};
    // send a request to the server
    $.ajax({
        url: 'analyze',
        method: 'POST',
        data: {'query': search_text},
        beforeSend: function(){
            // Show the loader
            $(".loader").show();

            // Shrink the header
            $("#splash").addClass("short");

            $("#concept_holder").html("");
            $("#concept_holder").hide();
        },
        success: function(response){
            // Hide the loader
            $(".loader").hide(); 

            // Show the results
            $(".results").show();
            $(".listing").html("<a id='show_graph' class='btn btn-primary btn-block' href='#'>Show Graph</a>");
            var $sentiment_filter = $("<div class='row filter_sentiment'></div>");

            $sentiment_filter.append("<div class='col-md-3'><a href='#' class='filter_sentiment_btn btn-block btn btn-success' data-filter='positive'>Show Only Positive</a></div>");
            $sentiment_filter.append("<div class='col-md-3'><a href='#' class='filter_sentiment_btn btn-block btn btn-warning' data-filter='neutral'>Show Only Neutral</a></div>");
            $sentiment_filter.append("<div class='col-md-3'><a href='#' class='filter_sentiment_btn btn-block btn btn-danger' data-filter='negative'>Show Only Negative</a></div>");
            $sentiment_filter.append("<div class='col-md-3'><a href='#' class='filter_sentiment_btn btn-block btn btn-default' data-filter='all'>Show All</a></div>");

            $(".listing").append($sentiment_filter);

            var results = response["results"],
                emoji = {
                    'positive': "em-smile",
                    'negative': "em-angry",
                    'neutral': "em-neutral_face",
                    'unknown': "em-grey_question"
                };

            results.forEach(function(result, index) {
                var sentiment = 'unknown';

                if ("docSentiment" in result && "type" in result["docSentiment"]) {
                    sentiment = result["docSentiment"]["type"];
                }

                
                var head_node = graph.newNode({sentiment: sentiment, highlighted: false, label: index+1, doc: true, ondoubleclick: function() {
                                $("#show_graph").trigger("click");
                                $(window).scrollTop($("#article-"+(index+1)).offset().top);
                                $("#article-"+(index+1)).trigger("click");
                            }});

                var $row = $("<div class='row'/>"),
                    $container = $("<div id='article-"+(index+1)+"' class='col-md-12 article_overview sentiment_"+sentiment+"'/>"),
                    $title = $("<h2 class='article-title'>"+
                                "<span data-node-id='"+head_node.id+"' class='btn btn-default btn_details'>"+(index + 1)+"</span>"+ 
                                ": <i class='em em-some-emoji "+ emoji[sentiment] +"'></i>" + 
                                result['title']+"</h2>"),
                    $url = $("<span class='url'><a href='"+result["url"]+"' target='_BLANK'><i class='glyphicon glyphicon-new-window'></i></a></span>");

                    
                
                $url.appendTo($title);
                $title.appendTo($container);
                $container.appendTo($row);
                $row.appendTo(".listing");

                $container.append("<p class='article-snippet'>"+result['text']+"<strong>...</strong></p>");

                // $concept_container = $("<div class='concept_container' />")
                // // Loop through Concepts
                // result["concepts"].forEach(function(concept, i){
                //     // Add to the nodes and connections
                //     var append = false;
                //     if (i >= 5) return ;
                //     if (!(concept["text"] in nodes_list)){
                //         var concept_node = graph.newNode({highlighted: false, label: concept['text'], doc: false});
                //         // console.log(concept_node);
                //         if (! (concept['text'] in concept_ids) ){
                //             concept_ids[concept['text']] = concept_node.id;
                //         }

                //         append = true;

                //         nodes_list[concept['text']] = concept_node;
                //     }

                //     graph.newEdge(head_node, nodes_list[concept['text']]);


                //     var $btn = $("<a href='#' data-node-id='"+nodes_list[concept['text']].id+"' class='btn btn-info btn_details'>"+concept['text']+"</a>");
                //     $concept_container.append($btn);
                //     if (append) $("#concept_holder").append($btn);
                // });
                // $container.append($concept_container);

                $entity_container = $("<div class='entity_container' />")
                result["entities"].forEach(function(entity, i){
                    // Add to the nodes and connections
                    var append = false;

                    if (i >= 5) return ;

                    if (!(entity["text"] in nodes_list)){
                        var concept_node = graph.newNode({highlighted: false, label: entity['text'], doc: false});
                        // console.log(concept_node);
                        if (! (entity['text'] in concept_ids) ){
                            concept_ids[entity['text']] = concept_node.id;
                        }

                        append = true;

                        nodes_list[entity['text']] = concept_node;
                    }

                    graph.newEdge(head_node, nodes_list[entity['text']], {'sentiment': entity['sentiment']['type'], 'weight': entity['relevance']});


                    var $btn = $("<a data-node-id='"+nodes_list[entity['text']].id+"' href='#' class='btn btn-primary btn_details'>"+entity['text']+"</a>");
                    $entity_container.append($btn);
                    if (append) $("#concept_holder").append($btn);
                    
                });
                $container.append($entity_container);


                var $drill_down = $("<div class='overview' />");

                $drill_down.append("<h4>Alchemy Summary</h4>");
                $drill_down.append("<p>"+result['alchemyapi_text']+"</p>")
                
                $drill_down.append("<h4>Watson 'Summary'</h4>");
                sentences = [];
                result["relations"].forEach(function(relation, i){
                    if ("subject" in relation && "action" in relation && "object" in relation){
                        var sentence_text = capitalizeFirstLetter(relation['subject']['text'])+" "+relation['action']['text']+" "+relation['object']['text'];
                        if (sentences.indexOf(sentence_text) == -1){
                            sentences.push(sentence_text);
                            var $summary_sentence = $("<span>"+sentence_text+". </span>");
                            $drill_down.append($summary_sentence);
                        }
                    }
                });

                // $drill_down.append("<pre>"+JSON.stringify(result)+"</pre>");

                $container.append($drill_down);

            });
            
            // console.log(response);
        }
    });

    $('#graph_diagram').springy({ graph: graph });

    return false;
});


$("body").on("click", "#show_graph", function(){
    var width = $(window).width(),
        height = $(window).height();

    if ($("#graph_diagram").is(":visible")){
        $(".filter_sentiment").show();
        $("#show_graph").text("Show Graph");
        $("#graph_diagram").hide();
        $(".article_overview").show();
        $(window).scrollTop(0);       
        $("#concept_holder").hide(); 
    } else {
        $("#show_graph").text("Show Results");
        $(".filter_sentiment").hide();
        $("#graph_diagram").attr("width", width);
        $("#graph_diagram").attr("height", height-50);
        $("#graph_diagram").show();
        $(window).scrollTop($("#graph_diagram").offset().top);
        $(".article_overview").hide();
        $("#concept_holder").show();
    }
    
    return false;
});

$("body").on("click", ".filter_sentiment_btn", function(){
    var show = $(this).data("filter");

    $(".sentiment_positive").show();
    $(".sentiment_negative").show();
    $(".sentiment_neutral").show();

    if (show != "positive" && show != "all") $(".sentiment_positive").hide();
    if (show != "negative" && show != "all") $(".sentiment_negative").hide();
    if (show != "neutral" && show != "all") $(".sentiment_neutral").hide();

    return false;
});

$("body").on("click", ".article_overview", function(){
    $(".article_overview.active").removeClass("active");
    $(".overview").hide();
    $(this).children(".overview").show();
    $(window).scrollTop($(this).offset().top);
    $(this).addClass("active");
});

$("body").on("click", ".btn_details", function(){
    if ($(this).data("node-id") != undefined) {
        graph.nodes[$(this).data("node-id")].data.highlighted = true;

        if (!$("#graph_diagram").is(":visible")) $("#show_graph").trigger("click");
    }

    return false;
});