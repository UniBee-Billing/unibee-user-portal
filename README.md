# Billing System Portal Webapp

This application provides a user-friendly interface for customers to manage their payments efficiently.

## Prerequisites

- Nodejs 18+

## Getting started

Clone this repository and install the dependencies.

```shell
# Clone this repository
git clone https://github.com/UniBee-Billing/unibee-user-portal

# Install dependencies
cd unibee-user-portal
yarn install
```

### Running the application

Define the following env variables in `.env` file.

```
VITE_API_URL=https://api.unibee.top
```

> .env.local for development, .env.production for production build

Now you can start dev server using the following command.

```shell
yarn dev
```

Open [https://localhost:5173/my-subscription](https://localhost:5173/my-subscription), note: it's httpS, not http

### Building the application

To build the application, run the following command:

```shell
yarn build
```

The build command will generate the static files in the `dist` folder of the project.

### Building with Docker

The admin portal also supports building the application using Docker, run the following command to build the docker image:

```shell
docker build -t <tag> .
```

# Development

Use `yarn add <package>` to add a new dependency, don't use `npm install <package>`.

## License

AGPLv3.
