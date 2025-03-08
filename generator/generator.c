#include <stdio.h>
#include <stdlib.h>

#include "reader/reader.h"

void main(int argc, char **argv) {
  const char *filename = "html/index.html";
  char *content = read_template(filename);

  if (content) {
    char *linked_content = link_template(content);
    free(content);

    if (linked_content) {
      printf("%s \n", linked_content);
      free(linked_content);
    }
  }
}
