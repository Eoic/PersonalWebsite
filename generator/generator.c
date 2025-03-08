#include <stdio.h>
#include <stdlib.h>

#include "reader/reader.h"

int main(int argc, char **argv) {
  const char *filename = "html/index.html";
  char *content = read_template(filename);

  if (content) {
    const char *template_root = "html/";
    char *linked_content = link_template(content, template_root);
    free(content);

    if (linked_content) {
      printf("%s\n", linked_content);
      free(linked_content);
    }
  }

  return 0;
}
