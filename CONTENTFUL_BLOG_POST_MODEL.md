# Contentful Content Model: Blog Post (`blogPost`)

**Content Type ID:** `blogPost`

## Fields Table

| Field Name | Field ID | Field Type | Details / Options |
| :--- | :--- | :--- | :--- |
| **Title** | `title` | Symbol (Short Text) | Required |
| **Slug** | `slug` | Symbol (Short Text) | Unique, URL identifier |
| **Summary / Excerpt** | `summary` | Text (Long Text) | Short teaser summary |
| **Cover Image** | `coverImage` | Media (Asset) | Single image |
| **Author** | `author` | Symbol (Short Text) | Author name string |
| **Date** | `date` | Date & Time | Publication date |
| **Category** | `category` | Array of Symbols OR References | Category name(s) e.g. `["Fiction", "Fantasy"]` or Reference to Category content type |
| **Read Time** | `readTime` | Symbol (Short Text) | e.g. `5 MIN READ` |
| **Is Featured?** | `is_featured` | Boolean | `true` = Show in Featured Banner Carousel |
| **Content** | `content` | Rich Text or Text | Article body |
