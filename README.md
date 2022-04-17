# Bastion

Data Warehouse for JVBastion

# Developer Information

## Reset all and create new user command

```
adonis migration:refresh && adonis user:add admin admin@admin.com 123456
```

## Dev Setup

1. `docker-compose up`
2. `npm install`
3. `cp .env.example .env`
4. `adonis key:generate`
5. `adonis migration:run`

## OAuth Information

OAuth is used for importing files from sources like Google Drive, Mega.nz, Dropbox and others

### Google OAuth
You will need the following as the privacy policy URL:

```
{{your-bastion-host}}/privacy-policy/
```

You will need to set the following as the redirect URL:

```
{{your-bastion-host}}/oauth/google
```

You will need to set the following env attributes:

* `GOOGLE_OAUTH_CLIENT_ID`
* `GOOGLE_OAUTH_CLIENT_SECRET`