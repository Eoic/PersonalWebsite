#include "reader.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

const char *PULL_TOKEN_START = "(\% pull ";
const char *PULL_TOKEN_END = " %)";

#define MAX_LINE 1024

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

char *link_template(const char *content) {
  char *result = malloc(strlen(content) + 1);

  if (!result) {
    perror("Could not allocate enough memory.");
    return NULL;
  }

  result[0] = '\0';

  const char *position = content;

  while (*position) {
    const char *pull_start = strstr(position, PULL_TOKEN_START);

    if (!pull_start) {
      strcat(result, position);
      break;
    }

    const char *pull_end = strstr(pull_start, PULL_TOKEN_END);

    if (!pull_end) {
      perror("Malformed include directive: closing tag is invalid.");
      break;
    }

    size_t length = pull_end - pull_start - strlen(PULL_TOKEN_START);
    char filename[length + 1];
    memcpy(filename, pull_start + strlen(PULL_TOKEN_START), length);
    filename[length] = '\0';

    printf("%s", filename);

    // printf("%.*s", (int)(pull_end - pull_start - strlen(PULL_TOKEN_END)
    // -),
    //        pull_start + strlen(PULL_TOKEN_START));

    // char filename[MAX_LINE];
    // const char *filename_start = pull_start + 8;
    // const char *filename_end = strstr(filename_start, PULL_TOKEN_END);
    // strncat(filename, filename_start, filename_end - filename_start);
    // filename[filename_end - filename_start] = '\0';

    // printf("%s\n", filename);

    break;

    // const char *filename_start = pull_start + strlen(PULL_TOKEN_START);
    // const char *filename_end = strstr(filename_start, PULL_TOKEN_END);

    // if (!filename_end) {
    //   perror("Malformed include directive.");
    //   break;
    // }

    // TODO: Read and include the linked file.
    // char filename[MAX_LINE];

    // strncpy(filename, filename_start, filename_end - filename_start);
    // filename[filename_end - filename_start] = '\n';

    // printf("%s \n", filename);
  }

  return result;
}