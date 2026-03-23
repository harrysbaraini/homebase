/**
 * 404 Not Found Page
 */

export default function NotFoundPage() {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>404 - homebase</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <main class="page-404">
          <div class="page-404__code">404</div>
          <p class="page-404__message">dashboard not found</p>
          <a href="/" class="page-404__link">← back to dashboards</a>
        </main>
      </body>
    </html>
  );
}
