# Learning backend 

## Proxy and Cors
Analogy - Ghar ke andar sbko allow nahi krna only specifc logo ki allow krna

**CORS (Cross-Origin Resource Sharing):**
- **What is it?** CORS is a security feature implemented by web browsers to control how web pages in one domain can request and interact with resources hosted on another domain.
- **Purpose:** It prevents a web page from making requests to a different domain than the one that served the web page. This is important for security reasons, as it helps protect users from potentially malicious actions by limiting cross-origin requests.
- **Example:** Imagine you have a website on `www.example.com` trying to make an AJAX request to `api.exampleapi.com`. CORS policies implemented by browsers will block such requests by default. Server-side configurations are needed to allow cross-origin requests explicitly.

**Proxy (in the context of the backend):**
- **What is it?** A proxy server acts as an intermediary between a client (like a web browser) and another server. It forwards client requests to the destination server and returns the server's responses to the client.
- **Purpose:** In the context of dealing with CORS issues, a proxy can be used to forward requests from a frontend application to a backend server, effectively bypassing the same-origin policy. The backend server, being on the same domain, won't face CORS restrictions.
- **Example:** Suppose your frontend code at `www.example.com` wants to make an API request to `api.exampleapi.com`, but you are facing CORS issues. You can set up a proxy server on your own domain, say `www.example.com/api-proxy`, which forwards requests to `api.exampleapi.com`. The frontend then makes requests to your proxy server (`www.example.com/api-proxy`), and the proxy, being on the same domain, avoids CORS restrictions when communicating with `api.exampleapi.com`.

### How to setup proxy in vite app - 
![Alt text](/Notes/images/image.png)


## Setup Professional Backend
- we temporarily store images/audio in our store and also on 3rd party service like cloudinary/aws, to prevent data loss in case 3rd party service is down
- we create temp folder , add .gitkeep empty file to push empty folder to github
- use [this website](https://mrkandreev.name/snippets/gitignore-generator/#Node) to generate giignore file
- install nodemon which automatically restarts server when file changes
- install it as dev dependancy so `npm i -D nodemon`
- install prettier for avoiding merge conflicts when working in a team and format the document properly, instal it as dev dependacy
- `.prettierrc` - has rules related to pretifying of a file and `prettierignore` - must include files where prettier should not be there






