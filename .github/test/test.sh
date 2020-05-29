won -hj testHtml.html -o test.json
cmp --silent testJSON.json test.json && echo 'HTML to JSON: Success' || echo 'HTML to JSON: Failed'
won -cj testCSS.css -o test.json
cmp --silent test.json testJss.json && echo 'CSS to JSON: Success' || echo 'CSS to JSON: Failed'