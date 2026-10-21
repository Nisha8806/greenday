IGEN GREENDAY 2026 - setup

A. Google Sheet backend
1. Create a Google Sheet. Extensions > Apps Script. Delete old code, paste Code.gs.
2. Change ADMIN_PASSCODE = 'change-me' to any password you choose (example: Green@2026). Organisers type it on the website's "Organiser login" to approve actions. It is not a Google password.
3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Authorize. Copy the Web app URL.
4. In index.html replace PASTE_WEB_APP_URL_HERE with that URL.
5. Organisations: institutions, industries and NGOs register on the website ("Register org"). You approve them on the Review page (organiser login in the footer). Approved organisations appear in the dropdown when participants join. You can also type names directly in the "orgs" tab (column A) after opening the website once. Rows with an empty status count as approved.

B. Logo
logo.png (top bar) and banner.jpg (home page) are already included. Replace them with your own files of the same names if needed.

C. Deploy on Vercel (VS Code terminal)
1. Open this folder in VS Code (File > Open Folder).
2. Terminal: npm i -g vercel
3. Terminal: vercel   (log in, accept defaults, framework: Other)
4. For the final link: vercel --prod

After editing Code.gs: Deploy > Manage deployments > Edit > New version.
