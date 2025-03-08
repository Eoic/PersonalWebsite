#include "reader.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

const char *PULL_TOKEN_START = "(\% pull ";
const char *PULL_TOKEN_END = " %)";

char *read_template(const char *filename) {
  FILE *file = fopen(filename, "r");

  if (!file) {
    perror("Could not open template file.");
    return NULL;
  }

  fseek(file, 0, SEEK_END);
  long size = ftell(file);
  rewind(file);

  char *buffer = malloc(size + 1);

  if (!buffer) {
    perror("Could not allocate enough memory.");
    fclose(file);
    return NULL;
  }

  fread(buffer, 1, size, file);
  buffer[size] = '\0';
  fclose(file);

  return buffer;
}

char *link_template(const char *content, const char *template_root) {
  size_t result_size = strlen(content) + 1;
  char *result = malloc(result_size);

  if (!result) {
    perror("Could not allocate memory.");
    return NULL;
  }

  result[0] = '\0';

  const char *position = content;

  while (*position) {
    const char *pull_start = strstr(position, PULL_TOKEN_START);

    if (!pull_start) {
      strncat(result, position, result_size - strlen(result) - 1);
      break;
    }

    const char *pull_end = strstr(pull_start, PULL_TOKEN_END);

    if (!pull_end) {
      perror("Malformed include directive: closing tag is invalid.");
      break;
    }

    // Append content before the include tag.
    strncat(result, position, pull_start - position);

    // Extract template filename.
    size_t length = pull_end - pull_start - strlen(PULL_TOKEN_START);
    char filename[length + 1];
    strncpy(filename, pull_start + strlen(PULL_TOKEN_START), length);
    filename[length] = '\0';

    // Construct full template path.
    size_t template_path_len = strlen(template_root) + length + 6;
    char *template_path = malloc(template_path_len);

    if (!template_path) {
      perror("Memory allocation failed.");
      free(result);
      return NULL;
    }

    snprintf(template_path, template_path_len, "%s%s%s", template_root,
             filename, strrchr(filename, '.') ? "" : ".html");

    // Read and append template content.
    char *template_content = read_template(template_path);
    free(template_path);

    if (!template_content) {
      perror("Template does not exist.");
      return NULL;
    }

    size_t new_size = result_size + strlen(template_content);
    result = realloc(result, new_size);

    if (!result) {
      perror("Memory allocation failed");
      free(template_content);
      return NULL;
    }

    strncat(result, template_content, new_size - strlen(result) - 1);
    free(template_content);
    result_size = new_size;

    // Move position after the include tag.
    position = pull_end + strlen(PULL_TOKEN_END);
  }

  return result;
}
